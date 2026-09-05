import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

// Initialize Firebase (SSR Safe)
export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);

/**
 * Register a new user in Firebase and immediately dispatch an Email Verification link
 */
export async function registerFirebaseUserWithVerification(
  email: string,
  pass: string,
  displayName: string
): Promise<{ firebaseUser: FirebaseUser; emailSent: boolean }> {
  const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
  const user = userCredential.user;

  // Update profile with full name
  if (displayName) {
    try {
      await updateProfile(user, { displayName });
    } catch (profileErr) {
      console.warn("Could not update displayName on Firebase profile:", profileErr);
    }
  }

  // Send verification email
  let emailSent = false;
  try {
    await sendEmailVerification(user, {
      url: typeof window !== "undefined" ? `${window.location.origin}/login?verified=true` : "http://localhost:3000/login",
      handleCodeInApp: false,
    });
    emailSent = true;
  } catch (emailErr) {
    console.error("Failed to send Firebase verification email:", emailErr);
  }

  return { firebaseUser: user, emailSent };
}

/**
 * Resend verification email to current user
 */
export async function resendFirebaseVerificationEmail(user?: FirebaseUser | null): Promise<boolean> {
  const targetUser = user || firebaseAuth.currentUser;
  if (!targetUser) throw new Error("No active Firebase user found to send verification email.");

  await sendEmailVerification(targetUser, {
    url: typeof window !== "undefined" ? `${window.location.origin}/login?verified=true` : "http://localhost:3000/login",
    handleCodeInApp: false,
  });
  return true;
}

/**
 * Reload user state and verify if email has been verified
 */
export async function checkEmailVerificationStatus(user?: FirebaseUser | null): Promise<boolean> {
  const targetUser = user || firebaseAuth.currentUser;
  if (!targetUser) return false;
  await targetUser.reload();
  return targetUser.emailVerified;
}

/**
 * Sign in user with Firebase email & password
 */
export async function loginWithFirebase(email: string, pass: string) {
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, pass);
  return {
    firebaseUser: credential.user,
    emailVerified: credential.user.emailVerified,
  };
}

/**
 * Sign out from Firebase
 */
export async function logoutFromFirebase() {
  await signOut(firebaseAuth);
}
