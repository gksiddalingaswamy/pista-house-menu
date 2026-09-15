const firebaseConfig = {
  apiKey: "AIzaSyCtREvVL-QgP0umyKu-DiZUEynDECxnYaY",
  authDomain: "malnadu-cafe-menu.firebaseapp.com",
  databaseURL: "https://malnadu-cafe-menu-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "malnadu-cafe-menu",
  storageBucket: "malnadu-cafe-menu.firebasestorage.app",
  messagingSenderId: "1062877731937",
  appId: "1:1062877731937:web:e27b853e43cbb7c3269e20"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Realtime Database
const database = firebase.database();