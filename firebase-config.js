// Using conditional mock Firebase config to comply with assignment while remaining production ready
// Loaded via Compat mode so it runs locally offline without CORS policy blocking it

const firebaseConfig = {
    apiKey: "MOCK_API_KEY",
    authDomain: "stadiumsync.firebaseapp.com",
    projectId: "stadiumsync",
    storageBucket: "stadiumsync.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdefgh"
};

// Application State
window.appState = { app: null, db: null, auth: null };

try {
    if (firebaseConfig.apiKey !== "MOCK_API_KEY" && window.firebase) {
        window.appState.app = firebase.initializeApp(firebaseConfig);
        window.appState.db = firebase.firestore();
        window.appState.auth = firebase.auth();
        console.log("🔥 Firebase initialized successfully with Remote Config");
    } else {
        console.warn("⚠️ Firebase Initialization Bypassed: Using Mock / Offline Context Mode since real API keys aren't provided.");
    }
} catch (error) {
    console.error("Firebase initialization failed:", error);
}
