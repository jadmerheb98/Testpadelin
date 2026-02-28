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

  // ===== Account Drawer + Local Auth Model (frontend-only) =====
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

// ===== Auth model (swap to real backend later) =====
const Auth = (function () {
  const STORAGE_KEY = "padelin_auth_v1";

  function safeParse(json) {
    try { return JSON.parse(json); } catch { return null; }
  }

  function getSession() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? safeParse(raw) : null;
    if (!data || typeof data !== "object") return null;
    if (!data.user || typeof data.user !== "object") return null;
    return data;
  }

  function getUser() {
    const session = getSession();
    return session ? session.user : null;
  }

  function setUser(user) {
    const payload = {
      user: {
        id: user.id || ("u_" + Math.random().toString(16).slice(2)),
        name: user.name || "Member",
        email: user.email || "",
        tier: user.tier || "Core",
        createdAt: user.createdAt || new Date().toISOString(),
      },
      token: "demo-token",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload.user;
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // Later: replace internals with real API calls
  async function signIn({ email, password }) {
    if (!email || !password) throw new Error("Missing credentials.");
    const guessName =
      (email.split("@")[0] || "Member")
        .replace(/[._-]+/g, " ")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase()) || "Member";
    return setUser({ email, name: guessName, tier: "Core" });
  }

  async function signUp({ name, email, password }) {
    if (!name || !email || !password) throw new Error("Missing details.");
    return setUser({ email, name, tier: "Core Plus" });
  }

  async function signOut() {
    clear();
    return true;
  }

  return { getUser, signIn, signUp, signOut };
})();

// ===== Drawer UI controller =====
const viewSignedOut = document.querySelector('[data-acc-view="signedOut"]');
const viewSignedIn = document.querySelector('[data-acc-view="signedIn"]');

const tabs = document.querySelectorAll("[data-acc-tab]");
const forms = document.querySelectorAll("[data-acc-form]");

const acctName = document.querySelector("[data-acc-name]");
const acctTier = document.querySelector("[data-acc-tier]");
const signOutBtn = document.querySelector("[data-acc-signout]");

function setActiveTab(name) {
  tabs.forEach((b) => b.classList.toggle("is-active", b.getAttribute("data-acc-tab") === name));
  forms.forEach((f) => f.classList.toggle("is-active", f.getAttribute("data-acc-form") === name));
}

function renderAccount() {
  const user = Auth.getUser();

  if (user) {
    if (viewSignedOut) {
      viewSignedOut.classList.remove("is-active");
      viewSignedOut.hidden = true;
    }
    if (viewSignedIn) {
      viewSignedIn.hidden = false;
      viewSignedIn.classList.add("is-active");
    }

    if (acctName) acctName.textContent = user.name || "Member";
    if (acctTier) acctTier.textContent = `Membership: ${user.tier || "Core"}`;
    return;
  }

  if (viewSignedIn) {
    viewSignedIn.classList.remove("is-active");
    viewSignedIn.hidden = true;
  }
  if (viewSignedOut) {
    viewSignedOut.hidden = false;
    viewSignedOut.classList.add("is-active");
  }

  setActiveTab("signin");
}

// Tabs
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    if (Auth.getUser()) return;
    setActiveTab(tab.getAttribute("data-acc-tab"));
  });
});

// Form submits
forms.forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const mode = form.getAttribute("data-acc-form"); // signin | signup
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const fd = new FormData(form);
      const email = String(fd.get("email") || "").trim();
      const password = String(fd.get("password") || "").trim();
      const name = String(fd.get("name") || "").trim();

      if (mode === "signin") {
        await Auth.signIn({ email, password });
      } else {
        await Auth.signUp({ name, email, password });
      }

      renderAccount();
    } catch (err) {
      const hint = form.querySelector(".acc-hint");
      if (hint) {
        hint.textContent = (err && err.message) ? err.message : "Something went wrong.";
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});

// Sign out
if (signOutBtn) {
  signOutBtn.addEventListener("click", async () => {
    await Auth.signOut();
    renderAccount();
  });
}

// Render on load
renderAccount();
  
  // Active link (desktop nav only)
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });
})();
