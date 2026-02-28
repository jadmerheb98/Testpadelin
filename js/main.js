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

  // ===== Account Drawer (login icon) =====
const accountOpenBtn = document.querySelector("[data-auth-open]");
const accountDrawer = document.querySelector("[data-account-drawer]");
const accountOverlay = document.querySelector("[data-account-overlay]");
const accountCloseBtn = document.querySelector("[data-account-close]");

function openAccount() {
  if (!accountDrawer || !accountOverlay) return;
  accountOverlay.classList.add("open");
  accountDrawer.classList.add("open");
  accountDrawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeAccount() {
  if (!accountDrawer || !accountOverlay) return;
  accountOverlay.classList.remove("open");
  accountDrawer.classList.remove("open");
  accountDrawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

if (accountOpenBtn) accountOpenBtn.addEventListener("click", openAccount);
if (accountCloseBtn) accountCloseBtn.addEventListener("click", closeAccount);
if (accountOverlay) accountOverlay.addEventListener("click", closeAccount);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAccount();
});
  
  // Active link (desktop nav only)
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });
})();
