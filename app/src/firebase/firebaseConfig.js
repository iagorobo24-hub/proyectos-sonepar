import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCewrc4PWFi0pWWs4atdmAP8W0Rebe3nF0",
  authDomain: "proyectos-sonepar.firebaseapp.com",
  projectId: "proyectos-sonepar",
  storageBucket: "proyectos-sonepar.firebasestorage.app",
  messagingSenderId: "475731260237",
  appId: "1:475731260237:web:7536fb1d403ebee3ee3d04",
  measurementId: "G-1N22WX9J92"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
