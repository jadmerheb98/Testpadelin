(function () {
  "use strict";

  const WORKER_BASE_URL =
    "https://solitary-morning-9ea4.padelin-lb.workers.dev";

  const REFRESH_INTERVAL = 3000;

  const elements = {
    topTime: document.getElementById("topTime"),
    currentDate: document.getElementById("currentDate"),
    welcomeTitle: document.getElementById("welcomeTitle"),
    refreshButton: document.getElementById("refreshButton"),

    reservationsToday: document.getElementById("reservationsToday"),
    totalMembers: document.getElementById("totalMembers"),
    revenueToday: document.getElementById("revenueToday"),
    pendingBookings: document.getElementById("pendingBookings"),

    lastUpdated: document.getElementById("lastUpdated"),
    courtsUpdated: document.getElementById("courtsUpdated"),

    court1Card: document.getElementById("court1Card"),
    court1Status: document.getElementById("court1Status"),
    court1Badge: document.getElementById("court1Badge"),
    court1Customer: document.getElementById("court1Customer"),
    court1Time: document.getElementById("court1Time"),
    court1FooterLeft: document.getElementById("court1FooterLeft"),
    court1FooterRight: document.getElementById("court1FooterRight"),

    court2Card: document.getElementById("court2Card"),
    court2Status: document.getElementById("court2Status"),
    court2Badge: document.getElementById("court2Badge"),
    court2Customer: document.getElementById("court2Customer"),
    court2Time: document.getElementById("court2Time"),
    court2FooterLeft: document.getElementById("court2FooterLeft"),
    court2FooterRight: document.getElementById("court2FooterRight"),

    nextBookingTime: document.getElementById("nextBookingTime"),
    nextBookingCustomer: document.getElementById("nextBookingCustomer"),
    nextBookingMeta: document.getElementById("nextBookingMeta"),
    nextBookingCourt: document.getElementById("nextBookingCourt"),
    nextBookingCountdown: document.getElementById("nextBookingCountdown"),
  };

  let isRefreshing = false;
  let refreshTimer = null;

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

  function formatTime(date, includeSeconds = false) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: includeSeconds ? "2-digit" : undefined,
      hour12: true,
    });
  }

  function updateHeader() {
    const now = new Date();
    const hour = now.getHours();

    if (elements.topTime) {
      elements.topTime.textContent = formatTime(now);
    }

    if (elements.currentDate) {
      elements.currentDate.textContent = formatDashboardDate(now);
    }

    if (elements.welcomeTitle) {
      const greeting =
        hour < 12
          ? "Good morning, Jad"
          : hour < 18
            ? "Good afternoon, Jad"
            : "Good evening, Jad";

      elements.welcomeTitle.textContent = greeting;
    }
  }

  function parseTimeToMinutes(value) {
    const text = String(value || "").trim();
    const match12 = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

    if (match12) {
      let hours = Number(match12[1]);
      const minutes = Number(match12[2]);
      const period = match12[3].toUpperCase();

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
    if (startMinutes === null || endMinutes === null) return endMinutes;
    return endMinutes <= startMinutes ? endMinutes + 1440 : endMinutes;
  }

  function normalizeStatus(rawStatus) {
    if (typeof rawStatus === "string") return rawStatus.toLowerCase();

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
    if (!rawStatus || typeof rawStatus !== "object") return "";

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

    if (!slots || typeof slots !== "object") return bookings;

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

    return bookings.sort((a, b) => a.startMinutes - b.startMinutes);
  }

  function isConfirmedStatus(status) {
    return ["reserved", "confirmed", "accepted", "paid"].includes(status);
  }

  function isPendingStatus(status) {
    return status === "pending";
  }

  function getCurrentMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
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

    return nowMinutes >= booking.startMinutes && nowMinutes < booking.endMinutes;
  }

  function countdownLabel(startMinutes) {
    const diff = Math.max(0, startMinutes - getCurrentMinutes());

    if (diff <= 0) return "Now";
    if (diff < 60) return `In ${diff} min`;

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;

    return minutes === 0
      ? `In ${hours}h`
      : `In ${hours}h ${minutes}m`;
  }

  function clearCourtClasses(card) {
    if (!card) return;
    card.classList.remove("is-live", "is-free", "is-pending");
  }

  function setBadge(badge, label, type) {
    if (!badge) return;
    badge.textContent = label;
    badge.className = `court-badge ${type}`;
  }

  function setCourtLive(courtNumber, booking) {
    const card = elements[`court${courtNumber}Card`];
    const status = elements[`court${courtNumber}Status`];
    const badge = elements[`court${courtNumber}Badge`];
    const customer = elements[`court${courtNumber}Customer`];
    const time = elements[`court${courtNumber}Time`];
    const footerLeft = elements[`court${courtNumber}FooterLeft`];
    const footerRight = elements[`court${courtNumber}FooterRight`];

    clearCourtClasses(card);
    card?.classList.add("is-live");
    setBadge(badge, "Playing", "live");

    if (status) status.textContent = "Currently playing";
    if (customer) customer.textContent = booking.customer || "Confirmed reservation";
    if (time) time.textContent = `${booking.start} – ${booking.end}`;
    if (footerLeft) footerLeft.textContent = "Session in progress";

    const current = getCurrentMinutes();
    const end = booking.endMinutes > 1440 && current < booking.startMinutes
      ? booking.endMinutes - 1440
      : booking.endMinutes;

    const remaining = Math.max(0, end - current);

    if (footerRight) footerRight.textContent = `Ends in ${remaining} min`;
  }

  function setCourtFree(courtNumber, nextBooking) {
    const card = elements[`court${courtNumber}Card`];
    const status = elements[`court${courtNumber}Status`];
    const badge = elements[`court${courtNumber}Badge`];
    const customer = elements[`court${courtNumber}Customer`];
    const time = elements[`court${courtNumber}Time`];
    const footerLeft = elements[`court${courtNumber}FooterLeft`];
    const footerRight = elements[`court${courtNumber}FooterRight`];

    clearCourtClasses(card);
    card?.classList.add("is-free");
    setBadge(badge, "Available", "free");

    if (status) status.textContent = "Available now";

    if (nextBooking) {
      if (customer) customer.textContent = nextBooking.customer || "Next confirmed reservation";
      if (time) time.textContent = `Next at ${nextBooking.start}`;
      if (footerLeft) footerLeft.textContent = "Next booking";
      if (footerRight) footerRight.textContent = countdownLabel(nextBooking.startMinutes);
    } else {
      if (customer) customer.textContent = "No upcoming reservation";
      if (time) time.textContent = "Available for the rest of today";
      if (footerLeft) footerLeft.textContent = "Court status";
      if (footerRight) footerRight.textContent = "Free";
    }
  }

  function setCourtPending(courtNumber, booking) {
    const card = elements[`court${courtNumber}Card`];
    const status = elements[`court${courtNumber}Status`];
    const badge = elements[`court${courtNumber}Badge`];
    const customer = elements[`court${courtNumber}Customer`];
    const time = elements[`court${courtNumber}Time`];
    const footerLeft = elements[`court${courtNumber}FooterLeft`];
    const footerRight = elements[`court${courtNumber}FooterRight`];

    clearCourtClasses(card);
    card?.classList.add("is-pending");
    setBadge(badge, "Pending", "pending");

    if (status) status.textContent = "Pending request";
    if (customer) customer.textContent = booking.customer || "Awaiting confirmation";
    if (time) time.textContent = `${booking.start} – ${booking.end}`;
    if (footerLeft) footerLeft.textContent = "Action needed";
    if (footerRight) footerRight.textContent = "Review";
  }

  function updateCourtStatus(bookings, courtLabel, courtNumber) {
    const currentMinutes = getCurrentMinutes();
    const courtBookings = bookings.filter((booking) => booking.court === courtLabel);

    const active = courtBookings.find((booking) =>
      isActiveBooking(booking, currentMinutes)
    );

    if (active) {
      setCourtLive(courtNumber, active);
      return;
    }

    const nextConfirmed = courtBookings
      .filter(
        (booking) =>
          isConfirmedStatus(booking.status) &&
          booking.startMinutes > currentMinutes
      )
      .sort((a, b) => a.startMinutes - b.startMinutes)[0];

    if (nextConfirmed) {
      setCourtFree(courtNumber, nextConfirmed);
      return;
    }

    const nextPending = courtBookings
      .filter(
        (booking) =>
          isPendingStatus(booking.status) &&
          booking.startMinutes > currentMinutes
      )
      .sort((a, b) => a.startMinutes - b.startMinutes)[0];

    if (nextPending) {
      setCourtPending(courtNumber, nextPending);
      return;
    }

    setCourtFree(courtNumber, null);
  }

  function updateNextBooking(bookings) {
    const currentMinutes = getCurrentMinutes();

    const nextBooking = bookings
      .filter(
        (booking) =>
          isConfirmedStatus(booking.status) &&
          booking.startMinutes > currentMinutes
      )
      .sort((a, b) => a.startMinutes - b.startMinutes)[0];

    if (!nextBooking) {
      if (elements.nextBookingTime) elements.nextBookingTime.textContent = "—";
      if (elements.nextBookingCustomer) elements.nextBookingCustomer.textContent = "No upcoming booking";
      if (elements.nextBookingMeta) elements.nextBookingMeta.textContent = "There are no more confirmed reservations today.";
      if (elements.nextBookingCourt) elements.nextBookingCourt.textContent = "—";
      if (elements.nextBookingCountdown) elements.nextBookingCountdown.textContent = "Today";
      return;
    }

    if (elements.nextBookingTime) elements.nextBookingTime.textContent = nextBooking.start;
    if (elements.nextBookingCustomer) elements.nextBookingCustomer.textContent = nextBooking.customer || "Confirmed reservation";
    if (elements.nextBookingMeta) elements.nextBookingMeta.textContent = `${nextBooking.start} – ${nextBooking.end}`;
    if (elements.nextBookingCourt) elements.nextBookingCourt.textContent = nextBooking.court;
    if (elements.nextBookingCountdown) elements.nextBookingCountdown.textContent = countdownLabel(nextBooking.startMinutes);
  }

  async function loadBookingData() {
    const today = new Date();
    const dateValue = formatWorkerDate(today);

    const response = await fetch(
      `${WORKER_BASE_URL}/date-status?date=${encodeURIComponent(dateValue)}&t=${Date.now()}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`Booking request failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.ok !== true) {
      throw new Error("Invalid booking server response");
    }

    const bookings = parseBookings(data.slots);

    const confirmed = bookings.filter((booking) =>
      isConfirmedStatus(booking.status)
    );

    const pending = bookings.filter((booking) =>
      isPendingStatus(booking.status)
    );

    if (elements.reservationsToday) {
      elements.reservationsToday.textContent = String(confirmed.length);
    }

    if (elements.pendingBookings) {
      elements.pendingBookings.textContent = String(pending.length);
    }

    updateCourtStatus(bookings, "Court 1", 1);
    updateCourtStatus(bookings, "Court 2", 2);
    updateNextBooking(bookings);
  }

  async function loadMemberCount() {
    if (!window.padelinDB) {
      if (elements.totalMembers) elements.totalMembers.textContent = "—";
      return;
    }

    try {
      const snapshot = await window.padelinDB.collection("users").get();

      if (elements.totalMembers) {
        elements.totalMembers.textContent = String(snapshot.size);
      }
    } catch (error) {
      console.error("Member count failed:", error);

      if (elements.totalMembers) {
        elements.totalMembers.textContent = "—";
      }
    }
  }

  function updateRevenuePlaceholder() {
    if (elements.revenueToday) {
      elements.revenueToday.textContent = "$—";
    }
  }

  function updateLastUpdated() {
    const now = new Date();

    if (elements.lastUpdated) {
      elements.lastUpdated.textContent = formatTime(now, true);
    }

    if (elements.courtsUpdated) {
      elements.courtsUpdated.textContent = formatTime(now);
    }
  }

  function setLoadingState(isLoading) {
    if (!elements.refreshButton) return;

    elements.refreshButton.disabled = isLoading;
    elements.refreshButton.style.opacity = isLoading ? "0.55" : "1";
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

  elements.refreshButton?.addEventListener("click", refreshDashboard);

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
