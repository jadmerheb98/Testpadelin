(function () {
  const tableBody = document.querySelector("[data-booking-body]");
  const confirmBtn = document.querySelector("[data-confirm]");
  const selectedText = document.querySelector("[data-selected-text]");
  const adminBadge = document.getElementById("adminBadge");

  // Day navigation elements (NEW)
  const dayPrevBtn = document.querySelector("[data-day-prev]");
  const dayNextBtn = document.querySelector("[data-day-next]");
  const dayLabelBtn = document.querySelector("[data-day-label]");
  const dayPicker = document.querySelector("[data-day-picker]");

  if (!tableBody || !confirmBtn || !selectedText) return;

  const isAdmin = localStorage.getItem("isAdmin") === "true";
  if (adminBadge && isAdmin) adminBadge.style.display = "block";

 
  // ✅ 10 AM -> 12 AM (midnight)
  const START_TIME = "10:00";
  const END_TIME = "24:00";

  const STEP_MINUTES = 30; // table divided every 30 mins
  const MIN_BOOK_MINUTES = 60; // minimum selection 60 mins

  // ✅ Taken slots stored per-day (so arrows actually matter)
  const STORAGE_KEY = "padelin_taken_by_date_v1";

  // ---- Date state (NEW) ----
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getLocalISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function formatDateLabel(d) {
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function syncDayUI() {
    if (dayLabelBtn) dayLabelBtn.textContent = formatDateLabel(currentDate);
    if (dayPicker) dayPicker.value = getLocalISO(currentDate);
  }

  // ---- Taken slots (per date) ----
  function loadTakenByDate() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      return obj && typeof obj === "object" ? obj : {};
    } catch {
      return {};
    }
  }

  function saveTakenByDate() {
    takenByDate[currentISO] = Array.from(taken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(takenByDate));
  }

  let takenByDate = loadTakenByDate();
  let currentISO = getLocalISO(currentDate);
  let taken = new Set(Array.isArray(takenByDate[currentISO]) ? takenByDate[currentISO] : []);

  // ---- Your existing selection engine (kept) ----
  const selected = new Set(); // `${timeRange}|${court}`
  let selectedCourt = null; // "court1" | "court2" | null
  let selectedStarts = []; // array of start minutes, consecutive

  // Accepts: "08:30" OR "08:30 AM" OR "8:30 PM"
  function parseTimeToMinutes(t) {
    const str = String(t).trim();

    const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let hh = Number(match[1]);
      const mm = Number(match[2]);
      const period = match[3].toUpperCase();

      if (period === "PM" && hh !== 12) hh += 12;
      if (period === "AM" && hh === 12) hh = 0;

      return hh * 60 + mm;
    }

    const parts = str.split(":");
    const hh = Number(parts[0]);
    const mm = Number(parts[1]);
    return hh * 60 + mm;
  }

  // ✅ Fix midnight: 24:00 -> 12:00 AM
  function minutesToTime(mins) {
    const normalized = ((mins % 1440) + 1440) % 1440; // 1440 -> 0
    const hours24 = Math.floor(normalized / 60);
    const minutes = normalized % 60;

    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

    const hh = String(hours12).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    return `${hh}:${mm} ${period}`;
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

  function toggleSelect(timeRange, court) {
    const startM = timeRangeToStartMinutes(timeRange);
    if (isTakenBlock(startM, court)) return;

    if (selectedCourt && selectedCourt !== court) {
      selectedCourt = court;
      selectedStarts = [startM];
      rebuildSelectedSetForUI();
      syncUI();
      return;
    }

    if (!selectedCourt) {
      selectedCourt = court;
      selectedStarts = [startM];
      rebuildSelectedSetForUI();
      syncUI();
      return;
    }

    if (selectedStarts.includes(startM)) {
      selectedStarts = selectedStarts.filter((m) => m !== startM);

      if (selectedStarts.length === 0) {
        selectedCourt = null;
      } else {
        selectedStarts.sort((a, b) => a - b);
        const chain = [selectedStarts[0]];
        for (let i = 1; i < selectedStarts.length; i++) {
          if (selectedStarts[i] === chain[chain.length - 1] + STEP_MINUTES) chain.push(selectedStarts[i]);
          else break;
        }
        selectedStarts = chain;
      }

      rebuildSelectedSetForUI();
      syncUI();
      return;
    }

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

    if (isAdmin) {
      div.addEventListener("click", () => {
        if (taken.has(k)) taken.delete(k);
        else taken.add(k);
        saveTakenByDate();
        clearSelection();
        render();
      });
      div.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (taken.has(k)) taken.delete(k);
          else taken.add(k);
          saveTakenByDate();
          clearSelection();
          render();
        }
      });
      return div;
    }

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
    document.querySelectorAll(".slot.selected").forEach((el) => el.classList.remove("selected"));

    if (isAdmin) {
      confirmBtn.disabled = true;
      selectedText.textContent = "Admin Mode: Tap slots to toggle status";
      return;
    }

    confirmBtn.disabled = true;
    selectedText.textContent = "No slot selected";

    if (selected.size === 0) return;

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

    selectedText.innerHTML = `
      <div style="white-space:nowrap;">${summary.start} → ${summary.end}</div>
      <div style="margin-top:6px; font-weight:700;">${summary.courtLabel}</div>
    `;

    if (mins >= MIN_BOOK_MINUTES) confirmBtn.disabled = false;
  }

  // ---- WhatsApp message uses CURRENT selected date ----
  function buildWhatsAppMessage(summary) {
    const formattedDate = formatDateLabel(currentDate);
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
      "Thank you!",
    ].join("\n");
  }

  function ensureStatusEl() {
  let el = document.querySelector("[data-res-status]");
  if (el) return el;

  el = document.createElement("div");
  el.className = "res-status";
  el.setAttribute("data-res-status", "");
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");

  const actions = document.querySelector(".booking-actions");
  if (actions) actions.insertAdjacentElement("afterend", el);
  return el;
}

function setStatus(type, text) {
  const el = ensureStatusEl();
  el.textContent = text;
  el.classList.remove("is-success", "is-error");
  if (type === "success") el.classList.add("is-success");
  if (type === "error") el.classList.add("is-error");
}

confirmBtn.addEventListener("click", async () => {
  if (isAdmin) return;

  // ✅ Require sign-in before confirming reservation
  const userRaw = localStorage.getItem("padelinUser");
  let user = null;
  try { user = userRaw ? JSON.parse(userRaw) : null; } catch { user = null; }

  if (!user || (!user.uid && !user.email)) {
    alert("Please sign in before confirming your reservation.");
    // Optional: open the account drawer (helps them sign in)
    document.querySelector("[data-auth-open]")?.click();
    setStatus("error", "Please sign in before confirming your reservation.");
    return;
  }

  const mins = selectedDurationMinutes();
  if (mins < MIN_BOOK_MINUTES) {
    setStatus("error", "Please select at least 60 minutes (2 consecutive 30-min slots).");
    return;
  }

  const summary = selectionSummary();
  if (!summary) return;
  
setStatus("success", "Automation removed. Step 2: we will rebuild WhatsApp clean.");
  
  });

  // ---- Day navigation wiring (NEW) ----
  function changeDateTo(newDate) {
    currentDate = newDate;
    currentISO = getLocalISO(currentDate);
    taken = new Set(Array.isArray(takenByDate[currentISO]) ? takenByDate[currentISO] : []);
    clearSelection();
    syncDayUI();
    render();
  }

  if (dayPrevBtn) dayPrevBtn.addEventListener("click", () => changeDateTo(addDays(currentDate, -1)));
  if (dayNextBtn) dayNextBtn.addEventListener("click", () => changeDateTo(addDays(currentDate, 1)));

  // Clicking the label opens the calendar picker
  if (dayLabelBtn && dayPicker) {
    dayLabelBtn.addEventListener("click", () => {
      // modern browsers
      if (typeof dayPicker.showPicker === "function") dayPicker.showPicker();
      else {
        dayPicker.focus();
        dayPicker.click();
      }
    });
  }

  if (dayPicker) {
    dayPicker.addEventListener("change", () => {
      if (!dayPicker.value) return;
      const [y, m, d] = dayPicker.value.split("-").map(Number);
      const picked = new Date(y, m - 1, d);
      picked.setHours(0, 0, 0, 0);
      changeDateTo(picked);
    });
  }

  // Init
  syncDayUI();
  render();
})();
