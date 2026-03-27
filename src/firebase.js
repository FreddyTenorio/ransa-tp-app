import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tus llaves de conexión a la base de datos de Ransa TP
const firebaseConfig = {
  apiKey: "AIzaSyCmsJyQduZK1svGixQrpFUagy6Xo6tKXgM",
  authDomain: "ransa-tp.firebaseapp.com",
  projectId: "ransa-tp",
  storageBucket: "ransa-tp.firebasestorage.app",
  messagingSenderId: "1049342182175",
  appId: "1:1049342182175:web:d0e1b70424de7de259e62a"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

