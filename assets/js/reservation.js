(function () {
  const tableBody = document.querySelector("[data-booking-body]");
  const confirmBtn = document.querySelector("[data-confirm]");
  const selectedText = document.querySelector("[data-selected-text]");

  if (!tableBody || !confirmBtn || !selectedText) return;

  // Configure times + taken slots (future: backend)
  const timeSlots = [
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 13:00",
    "13:00 - 14:00",
    "14:00 - 15:00",
    "15:00 - 16:00",
    "16:00 - 17:00",
    "17:00 - 18:00",
    "18:00 - 19:00",
    "19:00 - 20:00",
    "20:00 - 21:00"
  ];

  // Example: taken slots
  // key format: `${time}|court`
  const taken = new Set([
    "10:00 - 11:00|court1",
    "18:00 - 19:00|court1",
    "19:00 - 20:00|court2",
    "20:00 - 21:00|court2"
  ]);

  let selected = null; // { time, court }

  function render() {
    tableBody.innerHTML = "";

    timeSlots.forEach((time) => {
      const tr = document.createElement("tr");

      const tdTime = document.createElement("td");
      tdTime.textContent = time;

      const tdC1 = document.createElement("td");
      tdC1.appendChild(makeSlot(time, "court1"));

      const tdC2 = document.createElement("td");
      tdC2.appendChild(makeSlot(time, "court2"));

      tr.appendChild(tdTime);
      tr.appendChild(tdC1);
      tr.appendChild(tdC2);

      tableBody.appendChild(tr);
    });

    syncUI();
  }

  function makeSlot(time, court) {
    const div = document.createElement("div");
    div.className = "slot";
    div.setAttribute("role", "button");
    div.setAttribute("tabindex", "0");

    const key = `${time}|${court}`;
    const isTaken = taken.has(key);

    if (isTaken) {
      div.classList.add("taken");
      div.textContent = "Taken";
      div.setAttribute("aria-disabled", "true");
      return div;
    }

    div.textContent = "Available";
    div.addEventListener("click", () => select(time, court));
    div.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") select(time, court);
    });

    return div;
  }

  function select(time, court) {
    selected = { time, court };
    syncUI();
  }

  function syncUI() {
    // Clear all selected classes
    document.querySelectorAll(".slot.selected").forEach((el) => {
      el.classList.remove("selected");
    });

    confirmBtn.disabled = true;
    selectedText.textContent = "No slot selected";

    if (!selected) return;

    // Find the slot element by row/time + court cell index
    const rows = Array.from(tableBody.querySelectorAll("tr"));
    const row = rows.find((r) => r.firstChild && r.firstChild.textContent === selected.time);
    if (!row) return;

    const courtIndex = selected.court === "court1" ? 1 : 2; // 0=time, 1=c1, 2=c2
    const cell = row.children[courtIndex];
    const slotEl = cell ? cell.querySelector(".slot") : null;

    if (slotEl && !slotEl.classList.contains("taken")) {
      slotEl.classList.add("selected");
      confirmBtn.disabled = false;

      const courtLabel = selected.court === "court1" ? "Court 1" : "Court 2";
      selectedText.textContent = `${selected.time} • ${courtLabel}`;
    }
  }

  confirmBtn.addEventListener("click", () => {
    if (!selected) return;

    // Future: send to backend
    alert(`Reservation confirmed:\n${selectedText.textContent}\n\n(Frontend demo)`);
  });

  render();
})();
