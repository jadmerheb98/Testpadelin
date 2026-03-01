// js/firebase-init.js
// Firebase init (CDN compat) for PADELIN

const firebaseConfig = {
  apiKey: "AIzaSyA0WZUyKoNjlOzmEeEhPLALKsTmNmazBVE",
  authDomain: "padelin-9bc6d.firebaseapp.com",
  projectId: "padelin-9bc6d",
  storageBucket: "padelin-9bc6d.firebasestorage.app",
  messagingSenderId: "811369149103",
  appId: "1:811369149103:web:b69f74bbfe8adb22145a5a",
  measurementId: "G-0EDTQGB711"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Expose auth globally
window.padelinAuth = firebase.auth();
