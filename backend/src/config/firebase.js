const admin = require("firebase-admin");

let firebaseApp = null;

const initFirebase = () => {
  try {
    const existingApps = admin.getApps ? admin.getApps() : (admin.apps || []);
    if (existingApps && existingApps.length > 0) {
      return admin.getApp ? admin.getApp() : admin.app();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    if (projectId && clientEmail && privateKey) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
      });

      console.log(`🔥 Firebase Admin initialized (${projectId})`);
      return firebaseApp;
    } else if (projectId) {
      firebaseApp = admin.initializeApp({
        projectId,
        databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || undefined,
      });

      console.log(`🔥 Firebase Admin initialized (${projectId})`);
      return firebaseApp;
    }
    return null;
  } catch (error) {
    console.error(`Firebase initialization error: ${error.message}`);
    return null;
  }
};

module.exports = {
  admin,
  initFirebase,
  getFirebaseApp: () => {
    if (firebaseApp) return firebaseApp;
    const apps = admin.getApps ? admin.getApps() : (admin.apps || []);
    return apps.length > 0 ? (admin.getApp ? admin.getApp() : admin.app()) : null;
  },
};
