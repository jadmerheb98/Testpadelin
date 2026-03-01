// js/firebase-init.js
// 1) Paste your firebaseConfig from Firebase Console here.
const firebaseConfig = {
  apiKey: "PASTE",
  authDomain: "PASTE",
  projectId: "PASTE",
  appId: "PASTE",
};

// 2) Initialize Firebase (compat SDK so it works with your current non-module main.js)
firebase.initializeApp(firebaseConfig);

// 3) Expose auth
window.padelinAuth = firebase.auth();
