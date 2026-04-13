// Firebase Credentials (from your setup)
const firebaseConfig = {
    apiKey: "AIzaSyBrBEHenCIL35YjuI-RUEqLjpDkSafrnIc",
    authDomain: "cg-gym.firebaseapp.com",
    projectId: "cg-gym",
    storageBucket: "cg-gym.firebasestorage.app",
    messagingSenderId: "272466969199",
    appId: "1:272466969199:web:2b9ab775572c05fe22039a"
};

// Inicializar Firebase (Solo si no se ha inicializado ya)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Almacenar globalmente para usar en otros scripts sin importación obligatoria
window.auth = auth;
window.db = db;

// Para comprobar
console.log("Firebase listo 🔥");