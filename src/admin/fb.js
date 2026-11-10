// Firebase pieces the admin panel needs, bundled into admin/firebase.bundle.js by scripts/build.mjs
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, limit } from 'firebase/firestore/lite';
window.ClearFB = { initializeApp, getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, limit };
