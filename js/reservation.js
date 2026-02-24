(function () {
  const tableBody = document.querySelector("[data-booking-body]");
  const confirmBtn = document.querySelector("[data-confirm]");
  const selectedText = document.querySelector("[data-selected-text]");
  const adminBadge = document.getElementById("adminBadge");

  if (!tableBody || !confirmBtn || !selectedText) return;

  const isAdmin = localStorage.getItem("isAdmin") === "true";
  if (adminBadge && isAdmin) adminBadge.style.display = "block";

  // --- Config ---
  const CLUB_PHONE = "96171884882"; // WhatsApp target (no +)
  const START_TIME = "10:00";
  const END_TIME = "24:00";   // 12:00 AM
  const STEP_MINUTES = 30;          // table divided every 30 mins
  const MIN_BOOK_MINUTES = 60;      // minimum selection 60 mins

  // LocalStorage key for taken slots
  const STORAGE_KEY = "padelin_taken_v1";

  // Load taken slots from storage
  const taken = loadTakenSet();

  // Keep your original Set for UI highlighting (we rebuild it from the new selection engine)
  const selected = new Set(); // `${timeRange}|${court}`

  // New, reliable selection engine:
  // - One court at a time
  // - Selection must stay consecutive
  let selectedCourt = null;        // "court1" | "court2" | null
  let selectedStarts = [];         // array of start minutes, consecutive

  function loadTakenSet() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  function saveTakenSet() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(taken)));
  }

  // Accepts: "08:30" OR "08:30 AM" OR "8:30 PM"
  function parseTimeToMinutes(t) {
    const str = String(t).trim();

    // AM/PM: "h:mm AM"
    const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let hh = Number(match[1]);
      const mm = Number(match[2]);
      const period = match[3].toUpperCase();

      if (period === "PM" && hh !== 12) hh += 12;
      if (period === "AM" && hh === 12) hh = 0;

      return hh * 60 + mm;
    }

    // 24h fallback: "HH:MM"
    const parts = str.split(":");
    const hh = Number(parts[0]);
    const mm = Number(parts[1]);

    return hh * 60 + mm;
  }

  // Minutes -> "hh:mm AM/PM"
  function minutesToTime(mins) {
  const hours24 = (Math.floor(mins / 60) % 24 + 24) % 24; // wrap 24 → 0
  const minutes = mins % 60;

  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  const hh = String(hours12).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");

  return `${hh}:${mm} ${period}`;
}
  function buildSlots(startHHMM, endHHMM, step) {
    const start = parseTimeToMinutes(startHHMM); // 24h input OK
    const end = parseTimeToMinutes(endHHMM);     // 24h input OK
    const list = [];
    for (let m = start; m < end; m += step) {
      const a = minutesToTime(m);
      const b = minutesToTime(m + step);
      list.push(`${a} - ${b}`);
    }
    return list;
  }

  const timeSlots = buildSlots(START_TIME, END_TIME, STEP_MINUTES);

  function keyOf(timeRange, court) {
    return `${timeRange}|${court}`;
  }

  function startMinutesToRange(startM) {
    const a = minutesToTime(startM);
    const b = minutesToTime(startM + STEP_MINUTES);
    return `${a} - ${b}`;
  }

  function timeRangeToStartMinutes(timeRange) {
    const startStr = timeRange.split(" - ")[0].trim();
    return parseTimeToMinutes(startStr);
  }

  function isTakenBlock(startM, court) {
    const range = startMinutesToRange(startM);
    return taken.has(keyOf(range, court));
  }

  function rebuildSelectedSetForUI() {
    selected.clear();
    if (!selectedCourt || selectedStarts.length === 0) return;
    selectedStarts.forEach((startM) => {
      selected.add(keyOf(startMinutesToRange(startM), selectedCourt));
    });
  }

  function clearSelection() {
    selectedCourt = null;
    selectedStarts = [];
    selected.clear();
    syncUI();
  }

  // Reliable consecutive selection behavior
  function toggleSelect(timeRange, court) {
    const startM = timeRangeToStartMinutes(timeRange);
    if (isTakenBlock(startM, court)) return;

    // Switch court -> reset to that one block
    if (selectedCourt && selectedCourt !== court) {
      selectedCourt = court;
      selectedStarts = [startM];
      rebuildSelectedSetForUI();
      syncUI();
      return;
    }

    // First selection
    if (!selectedCourt) {
      selectedCourt = court;
      selectedStarts = [startM];
      rebuildSelectedSetForUI();
      syncUI();
      return;
    }

    // If tapped already-selected -> remove it, then keep consecutive chain from min upward
    if (selectedStarts.includes(startM)) {
      selectedStarts = selectedStarts.filter((m) => m !== startM);

      if (selectedStarts.length === 0) {
        selectedCourt = null;
      } else {
        selectedStarts.sort((a, b) => a - b);
        const chain = [selectedStarts[0]];
        for (let i = 1; i < selectedStarts.length; i++) {
          if (selectedStarts[i] === chain[chain.length - 1] + STEP_MINUTES) {
            chain.push(selectedStarts[i]);
          } else {
            break; // stop at first gap to keep it clean + consecutive
          }
        }
        selectedStarts = chain;
      }

      rebuildSelectedSetForUI();
      syncUI();
      return;
    }

    // Must be adjacent to extend; otherwise reset to the new block (clean UX)
    selectedStarts.sort((a, b) => a - b);
    const min = selectedStarts[0];
    const max = selectedStarts[selectedStarts.length - 1];

    const canExtendBefore = startM === min - STEP_MINUTES;
    const canExtendAfter = startM === max + STEP_MINUTES;

    if (!canExtendBefore && !canExtendAfter) {
      selectedStarts = [startM];
      rebuildSelectedSetForUI();
      syncUI();
      return;
    }

    selectedStarts.push(startM);
    selectedStarts.sort((a, b) => a - b);

    rebuildSelectedSetForUI();
    syncUI();
  }

  function selectedDurationMinutes() {
    return selectedStarts.length * STEP_MINUTES;
  }

  function selectionSummary() {
    if (!selectedCourt || selectedStarts.length === 0) return null;

    selectedStarts.sort((a, b) => a - b);
    const start = minutesToTime(selectedStarts[0]);
    const end = minutesToTime(selectedStarts[selectedStarts.length - 1] + STEP_MINUTES);

    const courtLabel = selectedCourt === "court1" ? "Court 1" : "Court 2";
    return { court: selectedCourt, courtLabel, start, end };
  }

  function makeSlotEl(timeRange, court) {
    const div = document.createElement("div");
    div.className = "slot";
    div.setAttribute("role", "button");
    div.setAttribute("tabindex", "0");

    const k = keyOf(timeRange, court);
    const isTaken = taken.has(k);

    if (isTaken) {
      div.classList.add("taken");
      div.textContent = "Taken";
      div.setAttribute("aria-disabled", "true");
    } else {
      div.textContent = "Available";
    }

    // Admin: click toggles taken/available (kept exactly as your logic)
    if (isAdmin) {
      div.addEventListener("click", () => {
        if (taken.has(k)) taken.delete(k);
        else taken.add(k);
        saveTakenSet();
        clearSelection();
        render();
      });
      div.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (taken.has(k)) taken.delete(k);
          else taken.add(k);
          saveTakenSet();
          clearSelection();
          render();
        }
      });
      return div;
    }

    // User: click selects blocks
    if (!isTaken) {
      div.addEventListener("click", () => toggleSelect(timeRange, court));
      div.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") toggleSelect(timeRange, court);
      });
    }

    return div;
  }

  function render() {
    tableBody.innerHTML = "";

    timeSlots.forEach((timeRange) => {
      const tr = document.createElement("tr");

      const tdTime = document.createElement("td");
      tdTime.textContent = timeRange;

      const tdC1 = document.createElement("td");
      tdC1.appendChild(makeSlotEl(timeRange, "court1"));

      const tdC2 = document.createElement("td");
      tdC2.appendChild(makeSlotEl(timeRange, "court2"));

      tr.appendChild(tdTime);
      tr.appendChild(tdC1);
      tr.appendChild(tdC2);

      tableBody.appendChild(tr);
    });

    syncUI();
  }

  function syncUI() {
    // clear selected classes
    document.querySelectorAll(".slot.selected").forEach((el) => el.classList.remove("selected"));

    // admin confirm button stays disabled (admin doesn't confirm bookings here)
    if (isAdmin) {
      confirmBtn.disabled = true;
      selectedText.textContent = "Admin Mode: Tap slots to toggle status";
      return;
    }

    confirmBtn.disabled = true;
    selectedText.textContent = "No slot selected";

    if (selected.size === 0) return;

    // Mark selected blocks in UI
    for (const k of selected) {
      const [timeRange, court] = k.split("|");
      const rows = Array.from(tableBody.querySelectorAll("tr"));
      const row = rows.find((r) => r.firstChild && r.firstChild.textContent === timeRange);
      if (!row) continue;

      const courtIndex = court === "court1" ? 1 : 2;
      const slotEl = row.children[courtIndex]?.querySelector(".slot");
      if (slotEl) slotEl.classList.add("selected");
    }

    const summary = selectionSummary();
    if (!summary) return;

    const mins = selectedDurationMinutes();

    // Your requested box layout:
    // Line 1: 08:00 AM → 09:00 AM (same line)
    // Line 2: Court 1
    // No minutes displayed
    selectedText.innerHTML = `
      <div style="white-space:nowrap;">${summary.start} → ${summary.end}</div>
      <div style="margin-top:6px; font-weight:700;">${summary.courtLabel}</div>
    `;

    // enable confirm only if >= 60 mins
    if (mins >= MIN_BOOK_MINUTES) confirmBtn.disabled = false;
  }

  function buildWhatsAppMessage(summary) {
    const today = new Date();
    const options = { weekday: "short", month: "short", day: "numeric", year: "numeric" };
    const formattedDate = today.toLocaleDateString("en-US", options);

    const courtNumber = summary.courtLabel.includes("1") ? "1" : "2";

    return [
      "Hello 👋",
      "",
      "I would like to reserve a court:",
      "",
      `📅 Date: ${formattedDate}`,
      `🎾 Court: ${courtNumber}`,
      `⏰ Time: ${summary.start} - ${summary.end}`,
      "",
      "Thank you!"
    ].join("\n");
  }

  confirmBtn.addEventListener("click", () => {
    if (isAdmin) return;

    const mins = selectedDurationMinutes();
    if (mins < MIN_BOOK_MINUTES) {
      alert("Please select at least 60 minutes (2 consecutive 30-min slots).");
      return;
    }

    const summary = selectionSummary();
    if (!summary) return;

    const message = buildWhatsAppMessage(summary);
    const url = `https://wa.me/${CLUB_PHONE}?text=${encodeURIComponent(message)}`;
    window.location.href = url;
  });

  render();
})();
