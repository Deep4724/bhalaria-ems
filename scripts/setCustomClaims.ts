// // scripts/setCustomClaims.ts
// import * as admin from "firebase-admin";
// import * as dotenv from "dotenv";

// dotenv.config();

// admin.initializeApp({
//   credential: admin.credential.cert({
//     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//     clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//     privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//   }),
// });

// const uid = "Db4fMimVaARcNTteOp8lcr4nS452";

// admin
//   .auth()
//   .setCustomUserClaims(uid, { role: "super-admin" })
//   .then(() => {
//     console.log(`✅ Custom claim set successfully for UID: ${uid}`);
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error("❌ Error setting custom claim:", error);
//     process.exit(1);
//   });
