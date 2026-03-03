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
