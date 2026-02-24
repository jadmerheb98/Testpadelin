(function () {

  const tableBody = document.querySelector("[data-booking-body]");
  const confirmBtn = document.querySelector("[data-confirm]");
  const selectedText = document.querySelector("[data-selected-text]");
  const dayLabel = document.querySelector("[data-day-label]");
  const prevBtn = document.querySelector("[data-day-prev]");
  const nextBtn = document.querySelector("[data-day-next]");

  if (!tableBody || !confirmBtn || !selectedText) return;

  const CLUB_PHONE = "96171884882";
  const STEP = 30;
  const MIN_BOOK_MINUTES = 60;

  let currentDate = new Date();
  let selectedCourt = null;
  let selectedStarts = [];

  function formatDate(d) {
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function updateDateLabel() {
    dayLabel.textContent = formatDate(currentDate);
  }

  prevBtn?.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 1);
    clearSelection();
    render();
  });

  nextBtn?.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 1);
    clearSelection();
    render();
  });

  function storageKey() {
    return "padelin_taken_" + currentDate.toISOString().split("T")[0];
  }

  function getTaken() {
    return new Set(JSON.parse(localStorage.getItem(storageKey()) || "[]"));
  }

  function saveTaken(set) {
    localStorage.setItem(storageKey(), JSON.stringify([...set]));
  }

  function minutesToTime(mins) {
    const h24 = Math.floor(mins / 60);
    const m = mins % 60;
    const period = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${String(h12).padStart(2,"0")}:${String(m).padStart(2,"0")} ${period}`;
  }

  function buildSlots() {
    const slots = [];
    for (let m = 8 * 60; m < 24 * 60; m += STEP) {
      slots.push(m);
    }
    return slots;
  }

  function autoSelect60(start, court, taken) {
  selectedCourt = court;

  // Always start fresh (prevents 3-slot weirdness)
  selectedStarts = [start];

  const next = start + STEP;
  const prev = start - STEP;

  const nextKey = `${next}|${court}`;
  const prevKey = `${prev}|${court}`;

  // Prefer forward: start + next
  if (!taken.has(nextKey) && next < 24 * 60) {
    selectedStarts.push(next);
    return;
  }

  // Otherwise try backward: prev + start
  if (!taken.has(prevKey) && prev >= 8 * 60) {
    selectedStarts = [prev, start];
    return;
  }

  // Else keep only 1 slot (confirm will stay disabled)
    
  }

  function calculatePricing(startMin, duration) {
    const hour = startMin / 60;

    let price = 0;
    let points = 0;

    const isHappy = hour >= 10 && hour < 16;

    if (isHappy) {
      if (duration === 60) price = 14;
      if (duration === 90) price = 20;
      points = 3 * (duration / 60);
    } else {
      if (duration === 60) price = 24;
      if (duration === 90) price = 34;
      points = 6 * (duration / 60);
    }

    return { price, points };
  }

  function render() {

    updateDateLabel();
    tableBody.innerHTML = "";
    const taken = getTaken();
    const slots = buildSlots();

    slots.forEach(start => {

      const tr = document.createElement("tr");

      const tdTime = document.createElement("td");
      tdTime.textContent = `${minutesToTime(start)} - ${minutesToTime(start + STEP)}`;

      ["court1", "court2"].forEach(court => {

        const td = document.createElement("td");
        const div = document.createElement("div");
        div.className = "slot";

        const key = `${start}|${court}`;
        const isTaken = taken.has(key);

        if (isTaken) {
          div.classList.add("taken");
          div.textContent = "Taken";
        } else {
          div.textContent = "Available";
          div.addEventListener("click", () => {
            autoSelect60(start, court, taken);
            syncUI();
          });
        }

        td.appendChild(div);
        tr.appendChild(td);
      });

      tr.prepend(tdTime);
      tableBody.appendChild(tr);
    });

    syncUI();
  }

  function clearSelection() {
    selectedCourt = null;
    selectedStarts = [];
    syncUI();
  }

  function syncUI() {

    document.querySelectorAll(".slot").forEach(el => el.classList.remove("selected"));

    confirmBtn.disabled = true;
    selectedText.textContent = "Select your time to see your booking summary here.";

    if (!selectedCourt || selectedStarts.length < 2) return;

   const rows = [...tableBody.querySelectorAll("tr")];

selectedStarts.forEach((slotStart) => {
  const label = `${minutesToTime(slotStart)} - ${minutesToTime(slotStart + STEP)}`;

  const row = rows.find((r) => r.firstChild && r.firstChild.textContent.trim() === label);
  if (!row) return;

  const index = selectedCourt === "court1" ? 1 : 2;
  const slotEl = row.children[index]?.querySelector(".slot");
  if (slotEl) slotEl.classList.add("selected");
});

    const start = selectedStarts[0];
    const end = selectedStarts[selectedStarts.length - 1] + STEP;
    const duration = selectedStarts.length * STEP;

    const { points } = calculatePricing(start, duration);

    selectedText.innerHTML = `
      <div>${minutesToTime(start)} → ${minutesToTime(end)}</div>
      <div class="sub">Court ${selectedCourt === "court1" ? "1" : "2"}</div>
    `;

    confirmBtn.disabled = false;
  }

  confirmBtn.addEventListener("click", () => {

    const start = selectedStarts[0];
    const end = selectedStarts[selectedStarts.length - 1] + STEP;
    const duration = selectedStarts.length * STEP;
    const { points } = calculatePricing(start, duration);

    const message = [
      `📅 Date: ${formatDate(currentDate)}`,
      `🎾 Court: ${selectedCourt === "court1" ? "1" : "2"}`,
      `⏰ Time: ${minutesToTime(start)} - ${minutesToTime(end)}`,
      `🎯 Points Earned: ${points}`
    ].join("\n");

    window.location.href =
      `https://wa.me/${CLUB_PHONE}?text=${encodeURIComponent(message)}`;
  });

  render();

})();
