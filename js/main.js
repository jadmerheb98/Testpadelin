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

  // ===== Auth Drawer (Login icon) =====
  const authOpenBtn = document.querySelector("[data-auth-open]");
  const authDrawer = document.getElementById("authDrawer");
  const authBackdrop = document.querySelector("[data-auth-backdrop]");
  const authCloseBtn = document.querySelector("[data-auth-close]");

  function openAuth() {
    if (!authDrawer || !authBackdrop) return;
    authDrawer.classList.add("open");
    authBackdrop.classList.add("open");
    authDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeAuth() {
    if (!authDrawer || !authBackdrop) return;
    authDrawer.classList.remove("open");
    authBackdrop.classList.remove("open");
    authDrawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  if (authOpenBtn) authOpenBtn.addEventListener("click", openAuth);
  if (authCloseBtn) authCloseBtn.addEventListener("click", closeAuth);
  if (authBackdrop) authBackdrop.addEventListener("click", closeAuth);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAuth();
  });

  // Tabs inside auth drawer
  const authTabs = document.querySelectorAll(".auth-tab");
  const authPanels = document.querySelectorAll(".auth-panel");

  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-auth-tab");

      authTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      authPanels.forEach((p) => p.classList.remove("active"));
      const panel = document.querySelector(`.auth-panel[data-auth-panel="${target}"]`);
      if (panel) panel.classList.add("active");
    });
  });
  
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
