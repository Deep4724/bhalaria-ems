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
// firebase-admin.ts
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// ✅ Initialize Admin SDK with default credentials (Cloud Run's service account)
const app = initializeApp({
  credential: applicationDefault(),
});

// ✅ Get Admin Auth and Firestore instances
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
