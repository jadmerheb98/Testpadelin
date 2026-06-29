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

window.padelinDB = firebase.firestore();
const supabaseUrl = "https://bmhcncvfmgolqjupcpyv.supabase.co";
const supabaseAnonKey = "sb_publishable_PvGD1fxnGKiN8lhwNivvmQ_cghzUzMu";

window.padelinSupabase = window.supabase.createClient(
  supabaseUrl,
  supabaseAnonKey
);
