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
  const START_TIME = "08:00";
  const END_TIME = "21:00";
  const STEP_MINUTES = 30;          // table divided every 30 mins
  const MIN_BOOK_MINUTES = 60;      // minimum selection 60 mins

  // LocalStorage key for taken slots
  const STORAGE_KEY = "padelin_taken_v1";

  // Load taken slots from storage
  const taken = loadTakenSet();

  // Selection: allow multiple 30-min slots but must be consecutive same court
  // We'll store as a Set of keys: `${time}|${court}`
  const selected = new Set();

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

  function parseTimeToMinutes(t) {
    // "HH:MM" -> minutes from 00:00
    const [hh, mm] = t.split(":").map(Number);
    return hh * 60 + mm;
  }

  function minutesToTime(mins) {
    const hh = String(Math.floor(mins / 60)).padStart(2, "0");
    const mm = String(mins % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  function buildSlots(startHHMM, endHHMM, step) {
    const start = parseTimeToMinutes(startHHMM);
    const end = parseTimeToMinutes(endHHMM);
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

  function clearSelection() {
    selected.clear();
    syncUI();
  }

  function toggleSelect(timeRange, court) {
    const k = keyOf(timeRange, court);
    if (taken.has(k)) return; // cannot select taken

    // If selecting on a different court than current selection, reset selection
    const currentCourt = getSelectedCourt();
    if (currentCourt && currentCourt !== court) {
      selected.clear();
    }

    if (selected.has(k)) selected.delete(k);
    else selected.add(k);

    // Keep selection "clean": enforce consecutive blocks only
    normalizeSelectionConsecutive();
    syncUI();
  }

  function getSelectedCourt() {
    for (const k of selected) {
      const court = k.split("|")[1];
      return court;
    }
    return null;
  }

  function getSelectedTimeRangesSorted() {
    const ranges = Array.from(selected).map((k) => k.split("|")[0]);
    ranges.sort((r1, r2) => {
      const start1 = parseTimeToMinutes(r1.split(" - ")[0]);
      const start2 = parseTimeToMinutes(r2.split(" - ")[0]);
      return start1 - start2;
    });
    return ranges;
  }

  function normalizeSelectionConsecutive() {
    if (selected.size <= 1) return;

    const court = getSelectedCourt();
    const ranges = getSelectedTimeRangesSorted();

    // Convert to start minutes for each block
    const starts = ranges.map((r) => parseTimeToMinutes(r.split(" - ")[0]));
    // Find longest consecutive chain based on STEP_MINUTES
    // Strategy: keep a chain that includes the most recently clicked block
    // Simpler: keep only the smallest-to-largest consecutive run
    let bestRun = [starts[0]];
    let currentRun = [starts[0]];

    for (let i = 1; i < starts.length; i++) {
      if (starts[i] === starts[i - 1] + STEP_MINUTES) {
        currentRun.push(starts[i]);
      } else {
        if (currentRun.length > bestRun.length) bestRun = currentRun;
        currentRun = [starts[i]];
      }
    }
    if (currentRun.length > bestRun.length) bestRun = currentRun;

    // Rebuild selected set using bestRun
    selected.clear();
    bestRun.forEach((startM) => {
      const a = minutesToTime(startM);
      const b = minutesToTime(startM + STEP_MINUTES);
      selected.add(keyOf(`${a} - ${b}`, court));
    });
  }

  function selectedDurationMinutes() {
    return selected.size * STEP_MINUTES;
  }

  function selectionSummary() {
    if (selected.size === 0) return null;

    const court = getSelectedCourt();
    const ranges = getSelectedTimeRangesSorted();
    const start = ranges[0].split(" - ")[0];
    const end = ranges[ranges.length - 1].split(" - ")[1];
    const courtLabel = court === "court1" ? "Court 1" : "Court 2";
    return { court, courtLabel, start, end, blocks: ranges.length };
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

    // Admin: click toggles taken/available
    if (isAdmin) {
      div.addEventListener("click", () => {
        if (taken.has(k)) taken.delete(k);
        else taken.add(k);
        saveTakenSet();
        clearSelection();
        render(); // re-render so statuses update
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

    // admin confirm button can stay disabled (admin doesn't confirm bookings here)
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
    selectedText.textContent = `${summary.start} → ${summary.end} • ${summary.courtLabel} • ${mins} min`;

    // enable confirm only if >= 60 mins
    if (mins >= MIN_BOOK_MINUTES) confirmBtn.disabled = false;
  }

  function buildWhatsAppMessage(summary) {
    // Short, creative, sporty message with all info
    return [
      "🏓 PADELIN Reservation Request",
      "Game on! 💪🔥",
      "",
      `📍 Byblos`,
      `🎾 ${summary.courtLabel}`,
      `⏱️ ${summary.start} - ${summary.end} (${selectedDurationMinutes()} min)`,
      "",
      "Please confirm availability and mark it as taken ✅"
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
