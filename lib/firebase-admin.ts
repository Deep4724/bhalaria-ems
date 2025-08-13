// import { cert, getApps, initializeApp } from "firebase-admin/app";
// import { getFirestore } from "firebase-admin/firestore";
// import serviceAccount from "../serviceAccountKey.json";

// const adminApp =
//   getApps().length === 0
//     ? initializeApp({
//         credential: cert({
//           projectId: serviceAccount.project_id,
//           clientEmail: serviceAccount.client_email,
//           privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"), // ✅ newline fix
//         }),
//       })
//     : getApps()[0];

// export const adminDB = getFirestore(adminApp);


// firebaseAdmin.ts
import serviceAccountRaw from '../serviceAccountKey.json';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { ServiceAccount } from 'firebase-admin';

// ✅ Cast raw key into correct type
const serviceAccount = serviceAccountRaw as ServiceAccount;

// ✅ Initialize Admin SDK with service account
const app = initializeApp({
  credential: cert(serviceAccount),
});

// ✅ Get Admin Auth and Firestore instances
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };