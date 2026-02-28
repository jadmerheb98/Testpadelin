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

// ===== Account Modal (Login icon) =====
const accountOpenBtn = document.querySelector("[data-auth-open]");
const accountModal = document.querySelector("[data-account-modal]");
const accountOverlay = document.querySelector("[data-account-overlay]");
const accountCloseBtn = document.querySelector("[data-account-close]");

function openAccount() {
  if (!accountModal || !accountOverlay) return;
  accountModal.classList.add("is-open");
  accountOverlay.classList.add("is-open");
  accountModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeAccount() {
  if (!accountModal || !accountOverlay) return;
  accountModal.classList.remove("is-open");
  accountOverlay.classList.remove("is-open");
  accountModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

if (accountOpenBtn) accountOpenBtn.addEventListener("click", openAccount);
if (accountCloseBtn) accountCloseBtn.addEventListener("click", closeAccount);
if (accountOverlay) accountOverlay.addEventListener("click", closeAccount);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAccount();
});
