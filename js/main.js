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
      tier: localStorage.getItem("padelinTier") || "Member",
    };

    localStorage.setItem("padelinUser", JSON.stringify(payload));
  }

  auth.onAuthStateChanged((user) => {
    setLocalUser(user);

    // ---------- Login page ----------
    const path = window.location.pathname.toLowerCase();
const title = document.title.toLowerCase();

const isLoginPage =
  /login\.html$/i.test(path) ||
  /admin-login\.html$/i.test(path) ||
  title.includes("login");

const isStaffLoginPage =
  /admin-login\.html$/i.test(path) ||
  title.includes("staff");

    if (isLoginPage) {
      const form = document.querySelector("form.auth-form-grid");
      if (form) {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();

          const email = (form.querySelector("#email")?.value || "").trim();
          const password = form.querySelector("#password")?.value || "";

          // ✅ Secret redirect to staff login (ONLY on normal login page)
const path = window.location.pathname.toLowerCase();
const isNormalLogin = path.endsWith("login.html") && !path.endsWith("admin-login.html");

const eVal = email.trim().toLowerCase();
const pVal = (password || "").trim().toLowerCase();

if (isNormalLogin && eVal === "admin@admin.com" && pVal === "admin@admin.com") {
  window.location.href = "admin-login.html";
  return; // IMPORTANT: stop here so Firebase sign-in doesn't run
}

          try {
            await auth.signInWithEmailAndPassword(email, password);

// ✅ Bootstrap: YOUR email becomes Admin one-time (sets staff marker)
const BOOTSTRAP_ADMIN_EMAIL = "brewlinecoffee.lb@gmail.com";
const u = auth.currentUser;

if (isStaffLoginPage) {
  // If it's you and not marked yet -> mark as STAFF:ADMIN
  if ((u?.email || "").toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
    if (!u.displayName || !u.displayName.startsWith("STAFF:")) {
      await u.updateProfile({ displayName: "STAFF:ADMIN" });
    }
  }

  // ✅ Staff gate: only users with displayName starting STAFF: can enter
  const dn = (u?.displayName || "");
  if (!dn.startsWith("STAFF:")) {
    await auth.signOut();
    alert("Staff access only.");
    return;
  }

  // Staff destination
  window.location.href = "admin-messages.html";
  return;
}

// Normal login
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
const password = form.querySelector("#password")?.value || "";

// ✅ Secret staff redirect from normal login page
if (window.location.pathname.toLowerCase().endsWith("/login.html")) {
  const e = email.toLowerCase();
  const p = password.toLowerCase();

  if (e === "admin@admin.com" && p === "admin@admin.com") {
    window.location.href = "admin-login.html";
    return;
  }
}

try {
  await auth.signInWithEmailAndPassword(email, password);
  window.location.href = "index.html";
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
  });
})();

// ================================
// Account Drawer (Clean)
// ================================
(function () {
  const openBtn = document.querySelector("[data-auth-open]");
  const drawer = document.querySelector("[data-acc-drawer]");
  const overlay = document.querySelector("[data-acc-overlay]");
  const closeBtn = document.querySelector("[data-acc-close]");
  const body = document.getElementById("accBody");

  if (!openBtn || !drawer || !overlay || !closeBtn || !body) return;

  let lastFocus = null;

  function lockScroll(lock) {
    document.body.style.overflow = lock ? "hidden" : "";
  }

  function openDrawer() {
    lastFocus = document.activeElement;
    overlay.classList.add("open");
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    lockScroll(true);
    closeBtn.focus();
  }

  function closeDrawer() {
    overlay.classList.remove("open");
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    lockScroll(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  openBtn.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) closeDrawer();
  });

function renderSignedOut() {
  body.innerHTML = `
    <div class="acc-signedout">

      <div class="acc-so-sub">
        Why create an account?
      </div>

      <div class="acc-so-bullets">
        <div class="b">• Book here faster.</div>
        <div class="b">• Track your points.</div>
        <div class="b">• Watch full replays.</div>
      </div>

      <div class="acc-so-divider"></div>

      <div class="acc-so-section">
        <div class="acc-so-sec-title">Sign In</div>
        <div class="acc-so-sec-sub">I already have an account</div>
        <button class="acc-so-btn" id="accGoLogin" type="button">Sign In</button>
      </div>

      <div class="acc-so-divider"></div>

      <div class="acc-so-section">
        <div class="acc-so-sec-title">Create Account</div>
        <div class="acc-so-sec-sub">New here? Create your account in seconds</div>
        <button class="acc-so-btn" id="accGoSignup" type="button">Create Account</button>
      </div>

      <div class="acc-so-foot">
        Secure sign-in • No spam • Cancel anytime
      </div>

    </div>
  `;

  // ✅ bind clicks AFTER HTML is injected
  const goLogin = document.getElementById("accGoLogin");
  const goSignup = document.getElementById("accGoSignup");

  if (goLogin) {
    goLogin.addEventListener("click", () => {
      window.location.href = "login.html";   // <-- change destination here
    });
  }

  if (goSignup) {
    goSignup.addEventListener("click", () => {
      window.location.href = "signup.html";  // <-- change destination here
    });
  }
}

  function renderSignedIn(user) {
    const name =
      (user && (user.displayName || user.email)) ||
      (JSON.parse(localStorage.getItem("padelinUser") || "{}").email) ||
      "Member";

    const tier = localStorage.getItem("padelinTier") || "Member";
    const membershipType = (localStorage.getItem("padelinMembershipType") || "").trim();
    const tierLine = membershipType ? `${tier} • ${membershipType}` : tier;

    const points = Number(localStorage.getItem("padelinPoints") || 0);

    body.innerHTML = `
      <div class="acc-card">
        <div>
          <div class="acc-name">${escapeHtml(name)}</div>
          <div class="acc-tier">${escapeHtml(tierLine)}</div>
        </div>
        <div class="acc-badge" aria-label="Points">
          <span class="num">${points}</span>
          <span class="lbl">pts</span>
        </div>
      </div>

      <div class="acc-links">
        <a class="acc-link" href="career.html">
          <div>
            <div class="k">My Career</div>
            <span class="s">Reservations, membership, stats</span>
          </div>
        </a>

        <a class="acc-link" href="training.html">
          <div>
            <div class="k">My Sessions</div>
            <span class="s">PT training sessions & schedule</span>
          </div>
        </a>

        <a class="acc-link" href="#">
          <div>
            <div class="k">My Replays</div>
            <span class="s">Camera clips and highlights</span>
          </div>
        </a>

        <a class="acc-link" href="#">
          <div>
            <div class="k">My Profile</div>
            <span class="s">Name, password, settings</span>
          </div>
        </a>
      </div>

      <div class="acc-actions">
        <button class="acc-cta" type="button" id="accSignOut">Sign Out</button>
      </div>
    `;

    const signOutBtn = document.getElementById("accSignOut");
    if (signOutBtn) {
      signOutBtn.onclick = async () => {
        try {
          if (window.padelinAuth) await window.padelinAuth.signOut();
          localStorage.removeItem("padelinUser");
          openBtn.classList.remove("has-auth-dot"); // green dot OFF
          closeDrawer();
          renderSignedOut();
        } catch (err) {
          alert(err.message || "Sign out failed.");
        }
      };
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Hook into Firebase auth if present (also toggles green dot)
  if (window.padelinAuth && typeof window.padelinAuth.onAuthStateChanged === "function") {
    window.padelinAuth.onAuthStateChanged((user) => {
      if (user) {
        renderSignedIn(user);
        openBtn.classList.add("has-auth-dot"); // green dot ON
      } else {
        renderSignedOut();
        openBtn.classList.remove("has-auth-dot"); // green dot OFF
      }
    });
  } else {
    renderSignedOut();
    openBtn.classList.remove("has-auth-dot");
  }
})();
// Signup page validation (confirm password + 8+ chars is handled by minlength)
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".auth-form-grid");
  if (!form) return;

  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");

  const validateMatch = () => {
    if (!password || !confirmPassword) return;

    if (confirmPassword.value && password.value !== confirmPassword.value) {
      confirmPassword.setCustomValidity("Passwords do not match.");
    } else {
      confirmPassword.setCustomValidity("");
    }
  };

  password?.addEventListener("input", validateMatch);
  confirmPassword?.addEventListener("input", validateMatch);

  form.addEventListener("submit", (e) => {
    validateMatch();
    if (!form.checkValidity()) {
      e.preventDefault(); // stop submit if invalid
      form.reportValidity(); // show browser messages
    }
  });
});
