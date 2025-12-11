    async function initializeFirebase() {
        // Check if Firebase is already initialized
        if (window.firebaseAPI && window.firebaseAPI.db !== undefined) {
            console.log("Firebase already initialized, skipping re-initialization");
            window.dispatchEvent(new Event("dbReady"));
            return;
        }

        if (window.location.protocol === 'file:') {
            console.warn("Firebase connection not available when running from file:// protocol - initializing offline mode");
            window.firebaseAPI = createMockFirebaseAPI();
            window.firebaseOnline = false;

            // Auto-login as guest if no user is stored
            if (!localStorage.getItem("username")) {
                localStorage.setItem("username", "guest");
            }
            window.dispatchEvent(new Event("dbReady"));
            return;
        }

        try {
            const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js");
            const { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, where, orderBy, addDoc, updateDoc, deleteDoc, increment, arrayUnion, serverTimestamp, limit: firestoreLimit } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js");
            const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js");
            const { getStorage, ref: storageRef, uploadBytes, getDownloadURL } = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js");

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

            // Check if Firebase app is already initialized
            let app;
            const existingApps = getApps();
            if (existingApps.length > 0) {
                app = existingApps[0];
                console.log("Using existing Firebase app instance");
            } else {
                app = initializeApp(firebaseConfig);
                console.log("Firebase app initialized for the first time");
            }
            
            const db = getFirestore(app);
            const auth = getAuth(app);
            const storage = getStorage(app);

            window.firebaseAPI = { 
                db, 
                auth,
                storage,
                setDoc, 
                getDoc, 
                doc, 
                createUserWithEmailAndPassword, 
                signInWithEmailAndPassword, 
                collection, 
                getDocs,
                query,
                where,
                orderBy,
                addDoc,
                updateDoc,
                deleteDoc,
                increment,
                arrayUnion,
                serverTimestamp,
                limit: firestoreLimit,
                storageRef,
                uploadBytes,
                getDownloadURL
            };
            window.firebaseOnline = true;
            console.debug("Firebase initialized successfully");
        } catch (error) {
            console.warn("Firebase connection failed, initializing offline mode:", error);
            window.firebaseAPI = createMockFirebaseAPI();
            window.firebaseOnline = false;
            if (!localStorage.getItem("username")) {
                localStorage.setItem("username", "guest");
            }
        }
        window.dispatchEvent(new Event("dbReady"));
    }

    function createMockFirebaseAPI() {
        return {
            db: null,
            auth: null,
            storage: null,
            setDoc: async () => { 
                console.debug("Mock setDoc called - data will be stored locally only");
                return Promise.resolve();
            },
            getDoc: async () => {
                console.debug("Mock getDoc called - no remote data available");
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
                return { docs: [], forEach: () => {} };
            },
            query: (...args) => null,
            where: (...args) => null,
            orderBy: (...args) => null,
            addDoc: async () => {
                console.log("Mock addDoc called - data will be stored locally only");
                return { id: 'mock_' + Date.now() };
            },
            updateDoc: async () => {
                console.log("Mock updateDoc called - data will be stored locally only");
                return Promise.resolve();
            },
            deleteDoc: async () => {
                console.log("Mock deleteDoc called - data will be stored locally only");
                return Promise.resolve();
            },
            increment: (n) => n,
            arrayUnion: (...args) => args,
            serverTimestamp: () => new Date().toISOString(),
            limit: (n) => null,
            storageRef: () => null,
            uploadBytes: async () => {
                console.log("Mock uploadBytes called - file upload requires internet connection");
                throw new Error("File upload requires internet connection");
            },
            getDownloadURL: async () => {
                console.log("Mock getDownloadURL called - requires internet connection");
                throw new Error("Getting download URL requires internet connection");
            }
        };
    }

    initializeFirebase();
