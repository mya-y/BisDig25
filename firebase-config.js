// js/firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyABitCIaHCJM48uUe-FfYpD-XQUJgWpdqA",
  authDomain: "bd25-79570.firebaseapp.com",
  projectId: "bd25-79570",
  storageBucket: "bd25-79570.firebasestorage.app",
  messagingSenderId: "722847596428",
  appId: "1:722847596428:web:4bddec1c56da8204a8a0a9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Cloudinary Config
const CLOUD_NAME = 'doa7ccgyl';
const CLOUD_PRESET = 'Web_kelas-bisdig25';

// Make available globally
window.db = db;
window.firestore = { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp };
window.CLOUD_NAME = CLOUD_NAME;
window.CLOUD_PRESET = CLOUD_PRESET;

console.log('✅ Firebase initialized successfully!');