(function () {
  "use strict";

  const WORKER_BASE_URL =
    "https://solitary-morning-9ea4.padelin-lb.workers.dev";

  const REFRESH_INTERVAL = 3000;

  const elements = {
    currentDate: document.getElementById("currentDate"),
    refreshButton: document.getElementById("refreshButton"),

    reservationsToday: document.getElementById("reservationsToday"),
    totalMembers: document.getElementById("totalMembers"),
    revenueToday: document.getElementById("revenueToday"),
    pendingBookings: document.getElementById("pendingBookings"),

    lastUpdated: document.getElementById("lastUpdated"),

    court1Card: document.getElementById("court1Card"),
    court1Status: document.getElementById("court1Status"),
    court1Badge: document.getElementById("court1Badge"),
    court1Customer: document.getElementById("court1Customer"),
    court1Time: document.getElementById("court1Time"),

    court2Card: document.getElementById("court2Card"),
    court2Status: document.getElementById("court2Status"),
    court2Badge: document.getElementById("court2Badge"),
    court2Customer: document.getElementById("court2Customer"),
    court2Time: document.getElementById("court2Time"),

    nextBookingTime: document.getElementById("nextBookingTime"),
    nextBookingCustomer: document.getElementById("nextBookingCustomer"),
    nextBookingMeta: document.getElementById("nextBookingMeta"),
    nextBookingCourt: document.getElementById("nextBookingCourt"),
  };

  let isRefreshing = false;
  let refreshTimer = null;

  function getToday() {
    const today = new Date();
    today.setSeconds(0, 0);
    return today;
  }

  function formatWorkerDate(date) {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatDashboardDate(date) {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatCurrentTime(date) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning, Jad";
    if (hour < 18) return "Good afternoon, Jad";
    return "Good evening, Jad";
  }

  function updateHeader() {
    const now = getToday();

    const welcomeTitle = document.querySelector(".welcome-card h2");

    if (welcomeTitle) {
      welcomeTitle.textContent = getGreeting();
    }

    if (elements.currentDate) {
      elements.currentDate.textContent =
        `${formatDashboardDate(now)} · ${formatCurrentTime(now)}`;
    }
  }

  function parseTimeToMinutes(value) {
    const text = String(value || "").trim();

    const twelveHourMatch = text.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (twelveHourMatch) {
      let hours = Number(twelveHourMatch[1]);
      const minutes = Number(twelveHourMatch[2]);
      const period = twelveHourMatch[3].toUpperCase();

      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      return hours * 60 + minutes;
    }

    const parts = text.split(":");

    if (parts.length >= 2) {
      const hours = Number(parts[0]);
      const minutes = Number(parts[1]);

      if (Number.isFinite(hours) && Number.isFinite(minutes)) {
        return hours * 60 + minutes;
      }
    }

    return null;
  }

  function normalizeEndMinutes(startMinutes, endMinutes) {
    if (startMinutes === null || endMinutes === null) {
      return endMinutes;
    }

    if (endMinutes <= startMinutes) {
      return endMinutes + 1440;
    }

    return endMinutes;
  }

  function normalizeStatus(rawStatus) {
    if (typeof rawStatus === "string") {
      return rawStatus.toLowerCase();
    }

    if (rawStatus && typeof rawStatus === "object") {
      return String(
        rawStatus.status ||
        rawStatus.booking_status ||
        rawStatus.state ||
        ""
      ).toLowerCase();
    }

    return "";
  }

  function getBookingCustomer(rawStatus) {
    if (!rawStatus || typeof rawStatus !== "object") {
      return "";
    }

    return (
      rawStatus.customer_name ||
      rawStatus.name ||
      rawStatus.customer ||
      rawStatus.user_name ||
      ""
    );
  }

  function parseBookings(slots) {
    const bookings = [];

    if (!slots || typeof slots !== "object") {
      return bookings;
    }

    Object.entries(slots).forEach(([fullKey, rawStatus]) => {
      const parts = fullKey.split("|");

      if (parts.length !== 3) return;

      const court = parts[0].trim();
      const start = parts[1].trim();
      const end = parts[2].trim();
      const status = normalizeStatus(rawStatus);

      const startMinutes = parseTimeToMinutes(start);
      let endMinutes = parseTimeToMinutes(end);

      if (startMinutes === null || endMinutes === null) return;

      endMinutes = normalizeEndMinutes(startMinutes, endMinutes);

      bookings.push({
        court,
        start,
        end,
        status,
        startMinutes,
        endMinutes,
        customer: getBookingCustomer(rawStatus),
      });
    });

    bookings.sort((a, b) => a.startMinutes - b.startMinutes);

    return bookings;
  }

  function isConfirmedStatus(status) {
    return [
      "reserved",
      "confirmed",
      "accepted",
      "paid",
    ].includes(status);
  }

  function isPendingStatus(status) {
    return status === "pending";
  }

  function isActiveBooking(booking, currentMinutes) {
    if (!isConfirmedStatus(booking.status)) return false;

    let nowMinutes = currentMinutes;

    if (
      booking.endMinutes > 1440 &&
      currentMinutes < booking.startMinutes
    ) {
      nowMinutes += 1440;
    }

    return (
      nowMinutes >= booking.startMinutes &&
      nowMinutes < booking.endMinutes
    );
  }

  function getUpcomingBookings(bookings, currentMinutes) {
    return bookings
      .filter((booking) => {
        if (
          !isConfirmedStatus(booking.status) &&
          !isPendingStatus(booking.status)
        ) {
          return false;
        }

        return booking.startMinutes > currentMinutes;
      })
      .sort((a, b) => a.startMinutes - b.startMinutes);
  }

  function clearCourtClasses(card) {
    if (!card) return;

    card.classList.remove("is-live", "is-free");
  }

  function setCourtLive(courtNumber, booking) {
    const card = elements[`court${courtNumber}Card`];
    const status = elements[`court${courtNumber}Status`];
    const badge = elements[`court${courtNumber}Badge`];
    const customer = elements[`court${courtNumber}Customer`];
    const time = elements[`court${courtNumber}Time`];

    clearCourtClasses(card);
    card?.classList.add("is-live");

    if (status) status.textContent = "Currently playing";

    if (badge) {
      badge.textContent = "Live";
      badge.className = "status-badge live";
    }

    if (customer) {
      customer.textContent =
        booking.customer || "Confirmed reservation";
    }

    if (time) {
      time.textContent = `${booking.start} – ${booking.end}`;
    }
  }

  function setCourtFree(courtNumber, nextBooking) {
    const card = elements[`court${courtNumber}Card`];
    const status = elements[`court${courtNumber}Status`];
    const badge = elements[`court${courtNumber}Badge`];
    const customer = elements[`court${courtNumber}Customer`];
    const time = elements[`court${courtNumber}Time`];

    clearCourtClasses(card);
    card?.classList.add("is-free");

    if (status) status.textContent = "Available now";

    if (badge) {
      badge.textContent = "Free";
      badge.className = "status-badge free";
    }

    if (nextBooking) {
      if (customer) {
        customer.textContent =
          nextBooking.customer || "Next confirmed reservation";
      }

      if (time) {
        time.textContent = `Next at ${nextBooking.start}`;
      }
    } else {
      if (customer) customer.textContent = "No upcoming reservation";
      if (time) time.textContent = "Available";
    }
  }

  function updateCourtStatus(bookings, courtLabel, courtNumber) {
    const now = getToday();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const courtBookings = bookings.filter(
      (booking) => booking.court === courtLabel
    );

    const activeBooking = courtBookings.find((booking) =>
      isActiveBooking(booking, currentMinutes)
    );

    if (activeBooking) {
      setCourtLive(courtNumber, activeBooking);
      return;
    }

    const nextBooking = courtBookings
      .filter(
        (booking) =>
          isConfirmedStatus(booking.status) &&
          booking.startMinutes > currentMinutes
      )
      .sort((a, b) => a.startMinutes - b.startMinutes)[0];

    setCourtFree(courtNumber, nextBooking);
  }

  function updateNextBooking(bookings) {
    const now = getToday();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const upcomingBookings = getUpcomingBookings(
      bookings,
      currentMinutes
    );

    const nextBooking = upcomingBookings[0];

    if (!nextBooking) {
      if (elements.nextBookingTime) {
        elements.nextBookingTime.textContent = "—";
      }

      if (elements.nextBookingCustomer) {
        elements.nextBookingCustomer.textContent =
          "No upcoming booking";
      }

      if (elements.nextBookingMeta) {
        elements.nextBookingMeta.textContent =
          "There are no more confirmed reservations today.";
      }

      if (elements.nextBookingCourt) {
        elements.nextBookingCourt.textContent = "—";
      }

      return;
    }

    if (elements.nextBookingTime) {
      elements.nextBookingTime.textContent = nextBooking.start;
    }

    if (elements.nextBookingCustomer) {
      elements.nextBookingCustomer.textContent =
        nextBooking.customer ||
        (isPendingStatus(nextBooking.status)
          ? "Pending reservation"
          : "Confirmed reservation");
    }

    if (elements.nextBookingMeta) {
      elements.nextBookingMeta.textContent =
        `${nextBooking.start} – ${nextBooking.end}`;
    }

    if (elements.nextBookingCourt) {
      elements.nextBookingCourt.textContent = nextBooking.court;
    }
  }

  async function loadBookingData() {
    const today = getToday();
    const dateValue = formatWorkerDate(today);

    const requestUrl =
      `${WORKER_BASE_URL}/date-status` +
      `?date=${encodeURIComponent(dateValue)}` +
      `&t=${Date.now()}`;

    const response = await fetch(requestUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Booking request failed with status ${response.status}`
      );
    }

    const data = await response.json();

    if (!data || data.ok !== true) {
      throw new Error("The booking server returned an invalid response.");
    }

    const bookings = parseBookings(data.slots);

    const confirmedBookings = bookings.filter((booking) =>
      isConfirmedStatus(booking.status)
    );

    const pendingBookings = bookings.filter((booking) =>
      isPendingStatus(booking.status)
    );

    if (elements.reservationsToday) {
      elements.reservationsToday.textContent =
        String(confirmedBookings.length);
    }

    if (elements.pendingBookings) {
      elements.pendingBookings.textContent =
        String(pendingBookings.length);
    }

    updateCourtStatus(bookings, "Court 1", 1);
    updateCourtStatus(bookings, "Court 2", 2);
    updateNextBooking(bookings);
  }

  async function loadMemberCount() {
    if (!window.padelinDB) {
      if (elements.totalMembers) {
        elements.totalMembers.textContent = "—";
      }

      return;
    }

    try {
      const snapshot = await window.padelinDB
        .collection("users")
        .get();

      if (elements.totalMembers) {
        elements.totalMembers.textContent =
          String(snapshot.size);
      }
    } catch (error) {
      console.error("Unable to load members:", error);

      if (elements.totalMembers) {
        elements.totalMembers.textContent = "—";
      }
    }
  }

  function updateRevenuePlaceholder() {
    /*
      Revenue comes from the POS database, not the public website Worker.
      We will connect this in the next step without exposing private keys.
    */

    if (elements.revenueToday) {
      elements.revenueToday.textContent = "$—";
    }
  }

  function updateLastUpdated() {
    if (!elements.lastUpdated) return;

    elements.lastUpdated.textContent =
      formatCurrentTime(new Date());
  }

  function setLoadingState(isLoading) {
    if (!elements.refreshButton) return;

    elements.refreshButton.disabled = isLoading;
    elements.refreshButton.style.opacity =
      isLoading ? "0.55" : "1";
  }

  async function refreshDashboard() {
    if (isRefreshing) return;

    isRefreshing = true;
    setLoadingState(true);
    updateHeader();

    try {
      await Promise.all([
        loadBookingData(),
        loadMemberCount(),
      ]);

      updateRevenuePlaceholder();
      updateLastUpdated();
    } catch (error) {
      console.error("Dashboard refresh failed:", error);

      if (elements.lastUpdated) {
        elements.lastUpdated.textContent = "Connection error";
      }
    } finally {
      isRefreshing = false;
      setLoadingState(false);
    }
  }

  function startAutomaticRefresh() {
    clearInterval(refreshTimer);

    refreshTimer = setInterval(() => {
      refreshDashboard();
    }, REFRESH_INTERVAL);
  }

  elements.refreshButton?.addEventListener("click", () => {
    refreshDashboard();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshDashboard();
      startAutomaticRefresh();
    } else {
      clearInterval(refreshTimer);
    }
  });

  updateHeader();
  refreshDashboard();
  startAutomaticRefresh();
})();
