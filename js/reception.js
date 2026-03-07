(function () {
  const auth = window.padelinAuth;
  const db = window.padelinDB;

  if (!auth) {
    alert("Firebase Auth is not loaded. Check js/firebase-init.js.");
    return;
  }

  const tabsWrap = document.querySelector(".reception-tabs");
  const signInForm = document.getElementById("receptionSignInForm");
  const signUpForm = document.getElementById("receptionSignUpForm");
  const tabButtons = document.querySelectorAll("[data-tab-btn]");

  const signInBtn = document.getElementById("receptionSignInBtn");
  const signUpBtn = document.getElementById("receptionSignUpBtn");

  const goToSignupLink = document.getElementById("goToSignupLink");
  const goToSigninLink = document.getElementById("goToSigninLink");

  const statusBox = document.getElementById("receptionStatus");

  const signedState = document.getElementById("receptionSignedState");
  const signedUserName = document.getElementById("signedUserName");
  const signedUserEmail = document.getElementById("signedUserEmail");
  const signOutReceptionBtn = document.getElementById("signOutReceptionBtn");

  const rewardsSection = document.getElementById("receptionRewardsSection");
  const seeRewardsBtn = document.getElementById("seeRewardsBtn");

  const rewardPopup = document.getElementById("rewardPopup");
  const rewardPopupBackdrop = document.getElementById("rewardPopupBackdrop");
  const rewardPopupDoneBtn = document.getElementById("rewardPopupDoneBtn");
  const rewardPopupCloseBtn = document.getElementById("rewardPopupCloseBtn");

  function setActiveTab(tab) {
    tabButtons.forEach((btn) => {
      const active = btn.dataset.tabBtn === tab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });

    signInForm.classList.toggle("is-active", tab === "signin");
    signUpForm.classList.toggle("is-active", tab === "signup");
    hideStatus();
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => setActiveTab(btn.dataset.tabBtn));
  });

  if (goToSignupLink) {
    goToSignupLink.addEventListener("click", () => setActiveTab("signup"));
  }

  if (goToSigninLink) {
    goToSigninLink.addEventListener("click", () => setActiveTab("signin"));
  }

  function showStatus(message, type) {
    if (!statusBox) return;

    if (type === "success") {
      statusBox.textContent = "";
      statusBox.className = "reception-status";
      return;
    }

    statusBox.textContent = message;
    statusBox.className = "reception-status is-visible";
    if (type === "error") statusBox.classList.add("is-error");
  }

  function hideStatus() {
    if (!statusBox) return;
    statusBox.textContent = "";
    statusBox.className = "reception-status";
  }

  function setButtonLoading(button, isLoading, loadingText, idleText) {
    if (!button) return;
    button.disabled = isLoading;
    button.textContent = isLoading ? loadingText : idleText;
  }

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

  function openRewardPopup() {
    if (!rewardPopup || !rewardPopupBackdrop) return;
    rewardPopup.classList.add("is-open");
    rewardPopupBackdrop.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeRewardPopup() {
    if (!rewardPopup || !rewardPopupBackdrop) return;
    rewardPopup.classList.remove("is-open");
    rewardPopupBackdrop.classList.remove("is-open");
    document.body.style.overflow = "";
    if (rewardsSection) rewardsSection.classList.add("is-visible");
  }

  if (rewardPopupDoneBtn) rewardPopupDoneBtn.addEventListener("click", closeRewardPopup);
  if (rewardPopupCloseBtn) rewardPopupCloseBtn.addEventListener("click", closeRewardPopup);
  if (rewardPopupBackdrop) rewardPopupBackdrop.addEventListener("click", closeRewardPopup);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeRewardPopup();
  });

  function resetRewardsUI() {
    if (rewardsSection) rewardsSection.classList.remove("is-visible");
    if (seeRewardsBtn) {
      seeRewardsBtn.disabled = false;
      seeRewardsBtn.textContent = "See rewards";
    }
  }

  function renderSignedInState(user) {
    const name = (user && (user.displayName || user.email)) || "Member";
    const email = (user && user.email) || "";

    signedUserName.textContent = name;
    signedUserEmail.textContent = email;

    signedState.classList.add("is-visible");
    if (tabsWrap) tabsWrap.style.display = "none";
    signInForm.classList.remove("is-active");
    signUpForm.classList.remove("is-active");
  }

  function renderSignedOutState() {
    signedState.classList.remove("is-visible");
    resetRewardsUI();
    hideStatus();

    if (tabsWrap) tabsWrap.style.display = "grid";
    setActiveTab("signin");
  }

  async function saveUserProfile(user, data) {
    if (!db || !user) return;

    await db.collection("users").doc(user.uid).set(
      {
        uid: user.uid,
        name: data.name || user.displayName || "",
        phone: data.phone || "",
        email: user.email || data.email || "",
        source: "reception",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  signInForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideStatus();

    const email = document.getElementById("receptionSignInEmail").value.trim();
    const password = document.getElementById("receptionSignInPassword").value;

    if (!email || !password) {
      showStatus("Please enter your email and password.", "error");
      return;
    }

    try {
      setButtonLoading(signInBtn, true, "Signing in...", "Sign In");
      resetRewardsUI();

      const cred = await auth.signInWithEmailAndPassword(email, password);

      setLocalUser(cred.user);
      renderSignedInState(cred.user);
      openRewardPopup();
    } catch (err) {
      showStatus(err.message || "Could not sign in.", "error");
    } finally {
      setButtonLoading(signInBtn, false, "Signing in...", "Sign In");
    }
  });

  signUpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideStatus();

    const name = document.getElementById("receptionName").value.trim();
    const phone = document.getElementById("receptionPhone").value.trim();
    const email = document.getElementById("receptionEmail").value.trim();
    const password = document.getElementById("receptionPassword").value;
    const confirmPassword = document.getElementById("receptionConfirmPassword").value;

    if (!name || !phone || !email || !password || !confirmPassword) {
      showStatus("Please complete all fields.", "error");
      return;
    }

    if (password.length < 8) {
      showStatus("Password must be at least 8 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showStatus("Passwords do not match.", "error");
      return;
    }

    try {
      setButtonLoading(signUpBtn, true, "Creating account...", "Create Account");
      resetRewardsUI();

      const cred = await auth.createUserWithEmailAndPassword(email, password);

      if (name) {
        await cred.user.updateProfile({ displayName: name });
      }

      await saveUserProfile(cred.user, { name, phone, email });

      setLocalUser(auth.currentUser || cred.user);
      renderSignedInState(auth.currentUser || cred.user);
      openRewardPopup();
    } catch (err) {
      showStatus(err.message || "Could not create account.", "error");
    } finally {
      setButtonLoading(signUpBtn, false, "Creating account...", "Create Account");
    }
  });

  if (seeRewardsBtn) {
    seeRewardsBtn.addEventListener("click", () => {
      seeRewardsBtn.disabled = true;
      seeRewardsBtn.textContent = "Rewards coming soon";
    });
  }

  if (signOutReceptionBtn) {
    signOutReceptionBtn.addEventListener("click", async () => {
      try {
        await auth.signOut();
        localStorage.removeItem("padelinUser");
        renderSignedOutState();
      } catch (err) {
        showStatus(err.message || "Could not sign out.", "error");
      }
    });
  }

  auth.onAuthStateChanged((user) => {
    setLocalUser(user);

    if (user) {
      renderSignedInState(user);
    } else {
      renderSignedOutState();
    }
  });
})();
