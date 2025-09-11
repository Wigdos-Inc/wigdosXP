// Firebase v9+ modular imports with offline fallback
async function initializeFirebase() {
    try {
        // Check if we're running from file:// protocol
        if (window.location.protocol === 'file:') {
            console.warn("Running from file:// protocol - Firebase modules cannot be loaded due to CORS restrictions");
            throw new Error("CORS restriction: Cannot load Firebase modules from file:// protocol");
        }
        
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js");
        const { getFirestore, doc, setDoc, getDoc, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js");
        const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js");

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

        window.firebaseAPI = { db, auth, setDoc, getDoc, doc, createUserWithEmailAndPassword, signInWithEmailAndPassword, collection, getDocs };
        window.firebaseOnline = true;

        console.log("Firebase initialized successfully");
        
    } catch (error) {
        console.warn("Firebase connection failed, initializing offline mode:", error);
        
        // Create mock Firebase API for offline use
        window.firebaseAPI = createMockFirebaseAPI();
        window.firebaseOnline = false;
        
        // Auto-login as guest if no user is stored
        if (!localStorage.getItem("username")) {
            localStorage.setItem("username", "guest");
        }
    }

    // Always dispatch dbReady event, whether online or offline
    window.dispatchEvent(new Event("dbReady"));
}

function createMockFirebaseAPI() {
    return {
        db: null,
        auth: null,
        setDoc: async () => { 
            console.log("Mock setDoc called - data will be stored locally only");
            return Promise.resolve();
        },
        getDoc: async () => {
            console.log("Mock getDoc called - no remote data available");
            return { exists: () => false };
        },
        doc: () => null,
        createUserWithEmailAndPassword: async () => {
            throw new Error("Account creation requires internet connection");
        },
        signInWithEmailAndPassword: async () => {
            throw new Error("Online login requires internet connection");
        },
        collection: () => null,
        getDocs: async () => {
            console.log("Mock getDocs called - no remote data available");
            return { docs: [] };
        }
    };
}

// Initialize Firebase (with fallback)
initializeFirebase();