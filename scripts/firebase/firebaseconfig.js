    // Firebase v9+ modular imports
    import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
    import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
    import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

    const firebaseConfig = {
    apiKey: "AIzaSyDqDU6p8BH1hTqox7f5Sj1ySTWifIP2818",
    authDomain: "wigdos-9aa6a.firebaseapp.com",
    databaseURL: "https://wigdos-9aa6a-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "wigdos-9aa6a",
    storageBucket: "wigdos-9aa6a.firebasestorage.app",
    messagingSenderId: "124867645389",
    appId: "1:124867645389:web:4530e19e575669f3cabe84",
    measurementId: "G-1KTKSSCJ33"
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    window.firebaseAPI = { db, auth, setDoc, getDoc, doc, createUserWithEmailAndPassword, signInWithEmailAndPassword };