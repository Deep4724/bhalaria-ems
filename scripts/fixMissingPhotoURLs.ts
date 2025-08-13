// import { initializeApp, cert } from "firebase-admin/app";
// import { getFirestore } from "firebase-admin/firestore";
// import { readFileSync, writeFileSync } from "fs";
// import path from "path";

// Import your service account key (ensure the JSON path is correct)
// const serviceAccount = JSON.parse(
//   readFileSync(path.join(__dirname, "../serviceAccountKey.json"), "utf8")
// );

// initializeApp({
//   credential: cert(serviceAccount),
// });

// const db = getFirestore();

// function isInvalidURL(url: unknown): url is string {
//   return (
//     typeof url !== "string" ||
//     url.trim() === "" ||
//     url.includes("undefined") ||
//     url.endsWith("/") ||
//     !url.startsWith("http")
//   );
// }

// async function fixMissingPhotoURLs() {
//   const snapshot = await db.collection("employees").get();
//   const logs: string[] = [];
//   let updated = 0;

//   for (const doc of snapshot.docs) {
//     const data = doc.data();
//     const photoURL = data.photoURL;
//     const email = data.email;
//     const fullName = data.fullName ?? "Unknown";

//     if (!email) {
//       logs.push(`❌ Skipped ${fullName} — missing email`);
//       continue;
//     }

//     if (isInvalidURL(photoURL)) {
//       const fallbackURL = `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`;
//       await doc.ref.update({ photoURL: fallbackURL });
//       updated++;
//       logs.push(`✅ Updated ${fullName} → ${fallbackURL}`);
//     } else {
//       logs.push(`ℹ️ Skipped ${fullName} (valid photoURL)`);
//     }
//   }

//   Save log
//   const logPath = path.join(__dirname, "fixPhotoURLs.log");
//   writeFileSync(logPath, logs.join("\n"));
//   console.log(`✔️ ${updated} employees updated.`);
//   console.log(`📄 Log saved to: ${logPath}`);
// }

// fixMissingPhotoURLs().catch((err) => {
//   console.error("❌ Script error:", err);
// });
