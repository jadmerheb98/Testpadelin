(function () {
  const hamburger = document.querySelector("[data-hamburger]");
  const overlay = document.querySelector("[data-overlay]");
  const sideMenu = document.querySelector("[data-side-menu]");
  const closeBtn = document.querySelector("[data-side-close]");

  function openMenu() {
    overlay.classList.add("open");
    sideMenu.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    overlay.classList.remove("open");
    sideMenu.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (hamburger && overlay && sideMenu && closeBtn) {
    hamburger.addEventListener("click", openMenu);
    closeBtn.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  // Active link (desktop nav only)
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });
})();
// ===== AUTH PANEL (login icon) =====
(function () {
  const openBtn = document.querySelector("[data-auth-open]");
  const closeBtn = document.querySelector("[data-auth-close]");
  const overlay = document.querySelector("[data-auth-overlay]");
  const panel = document.querySelector("[data-auth-panel]");
  const tabs = document.querySelectorAll("[data-auth-tab]");
  const forms = document.querySelectorAll("[data-auth-form]");

  if (!openBtn || !closeBtn || !overlay || !panel) return;

  function openAuth() {
    overlay.classList.add("is-open");
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
  }

  function closeAuth() {
    overlay.classList.remove("is-open");
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  }

  openBtn.addEventListener("click", openAuth);
  closeBtn.addEventListener("click", closeAuth);
  overlay.addEventListener("click", closeAuth);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAuth();
  });

  // tabs switch
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabs.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      const name = btn.getAttribute("data-auth-tab");
      forms.forEach((f) => {
        f.classList.toggle("is-active", f.getAttribute("data-auth-form") === name);
      });
    });
  });
})();
