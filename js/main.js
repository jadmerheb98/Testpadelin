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
// =========================================
// Firebase Auth Wiring (Email/Password)
// =========================================
(function () {
  if (!window.padelinAuth) return;

  const auth = window.padelinAuth;

  function setLocalUser(user) {
    if (!user) {
      localStorage.removeItem("padelinUser");
      return;
    }

    const payload = {
      uid: user.uid,
      email: user.email || "",
      name: user.displayName || "",
      tier: localStorage.getItem("padelinTier") || "Member"
    };

    localStorage.setItem("padelinUser", JSON.stringify(payload));
  }

  auth.onAuthStateChanged((user) => {
  setLocalUser(user);

  // Green dot on home page account icon when signed in
  const isHome =
    window.location.pathname.endsWith("/") ||
    window.location.pathname.endsWith("/index.html") ||
    window.location.pathname.endsWith("index.html");

  const accountBtn = document.querySelector("[data-auth-open]");
  if (accountBtn) {
    if (isHome && user) accountBtn.classList.add("has-auth-dot");
    else accountBtn.classList.remove("has-auth-dot");
  }
});

  // ---------- Login page ----------
  const isLoginPage =
    /login\.html$/i.test(window.location.pathname) ||
    document.title.toLowerCase().includes("login");

  if (isLoginPage) {
    const form = document.querySelector("form.auth-form-grid");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = (form.querySelector("#email")?.value || "").trim();
        const password = form.querySelector("#password")?.value || "";

        try {
          await auth.signInWithEmailAndPassword(email, password);
          window.location.href = "index.html";
        } catch (err) {
          alert(err.message);
        }
      });

      // Forgot password link is currently href="#" in your login page
      const forgot = form.querySelector('.auth-link[href="#"]');
      if (forgot) {
        forgot.addEventListener("click", async (e) => {
          e.preventDefault();

          const email = (form.querySelector("#email")?.value || "").trim();
          if (!email) {
            alert("Enter your email first.");
            return;
          }

          try {
            await auth.sendPasswordResetEmail(email);
            alert("Password reset email sent.");
          } catch (err) {
            alert(err.message);
          }
        });
      }
    }
  }

  // ---------- Signup page ----------
  const isSignupPage =
    /signup\.html$/i.test(window.location.pathname) ||
    document.title.toLowerCase().includes("sign up");

  if (isSignupPage) {
    const form = document.querySelector("form.auth-form-grid");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = (form.querySelector("#name")?.value || "").trim();
        const email = (form.querySelector("#email")?.value || "").trim();
        const password = form.querySelector("#password")?.value || "";

        try {
          const cred = await auth.createUserWithEmailAndPassword(email, password);
          if (name) await cred.user.updateProfile({ displayName: name });
          window.location.href = "index.html";
        } catch (err) {
          alert(err.message);
        }
      });
    }
  }

  // Global sign out (we’ll wire this to the drawer button next)
  window.padelinSignOut = async function () {
    await auth.signOut();
    localStorage.removeItem("padelinUser");
  };
})();
// =========================================
// Account Drawer Rendering (Signed out / Signed in)
// =========================================
(function () {
  const body = document.getElementById("accountDrawerBody");
  if (!body) return;

  function icon(svgPathD) {
    return `
      <svg class="ico" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="${svgPathD}"></path>
      </svg>
    `;
  }

  function item(href, title, subtitle, svgPathD) {
    return `
      <a class="account-item" href="${href}">
        ${icon(svgPathD)}
        <span>
          <span class="label">${title}</span>
          ${subtitle ? `<span class="sub">${subtitle}</span>` : ``}
        </span>
      </a>
    `;
  }

  function renderSignedOut() {
    body.innerHTML = `
      <div class="account-block">
        <div class="account-label">Registered Users</div>
        <div class="account-sub">Have an account? Sign in now.</div>

        <a class="account-btn primary" href="login.html">
          <svg class="btn-ico" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor"
              d="M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5zm0 2c-4.4 0-8 2.2-8 5v1c0 .6.4 1 1 1h14c.6 0 1-.4 1-1v-1c0-2.8-3.6-5-8-5z"/>
          </svg>
          <span>Sign In</span>
        </a>
      </div>

      <div class="account-divider"></div>

      <div class="account-block">
        <div class="account-label">New Customer</div>
        <div class="account-sub">
          Create an account to reserve faster and manage your bookings.
        </div>

        <a class="account-btn" href="signup.html">
          <svg class="btn-ico" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor"
              d="M19 11h-6V5a1 1 0 0 0-2 0v6H5a1 1 0 0 0 0 2h6v6a1 1 0 0 0 2 0v-6h6a1 1 0 0 0 0-2z"/>
          </svg>
          <span>Create Account</span>
        </a>
      </div>

      <div class="account-micro">
        Secure sign-in • No spam • Cancel anytime
      </div>
    `;
  }

  function renderSignedIn(user) {
  const name = user?.displayName || "Member";

  // Tier label stays "Member" by default (you can change later)
  const tier = localStorage.getItem("padelinTier") || "Member";

  // Optional membership type (example: Gold / Platinum). If not set, show only "Member".
  const membershipType = (localStorage.getItem("padelinMembershipType") || "").trim();
  const tierLine = membershipType ? `${tier} • ${membershipType}` : tier;

  // Points display (not clickable)
  const points = Number(localStorage.getItem("padelinPoints") || 0);

    body.innerHTML = `
    <div class="account-user-header account-item account-user-card" role="group" aria-label="Account overview">
      <div class="account-user-left">
        <div class="account-user-name">${name}</div>
        <div class="account-user-tier">${tierLine}</div>
      </div>

      <div class="account-user-right" aria-label="Points">
        <div class="account-points-badge">
          <span class="points-num">${points}</span>
          <span class="points-label">pts</span>
        </div>
      </div>
    </div>

    <div class="account-grid">

            <!-- 2) My Career (normal button/link) -->
      <a class="account-item" href="career.html">
        ${icon("M6 7h12v2H6V7zm0 4h12v2H6v-2zm0 4h8v2H6v-2z")}
        <span>
          <span class="label">My Career</span>
          <span class="sub">Reservations, membership, training, stats</span>
        </span>
      </a>

      <!-- 3) My Replays -->
      ${item("#", "My Replays", "Camera clips and highlights", "M8 5h8a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3zm3.2 4.4v5.2L15.6 12l-4.4-2.6z")}

      <!-- 4) My Profile -->
      ${item("#", "My Profile", "Name, password, settings", "M12 12c2.8 0 5-2.2 5-5s-2.2-5-5-5-5 2.2-5 5 2.2 5 5 5zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z")}
    </div>

    <div class="account-actions">
      <button class="account-signout" type="button" id="accountSignOutBtn">Sign Out</button>
    </div>
  `;

  // Sign out
  const btn = document.getElementById("accountSignOutBtn");
  if (btn) {
    btn.addEventListener("click", async () => {
      if (window.padelinSignOut) await window.padelinSignOut();
      renderSignedOut();
    });
  }
}

  // Listen to auth state changes and render
  if (window.padelinAuth) {
    window.padelinAuth.onAuthStateChanged((user) => {
      if (user) renderSignedIn(user);
      else renderSignedOut();
    });
  } else {
    renderSignedOut();
  }
})();
