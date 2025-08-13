//verify-2fa-code.ts (verify code) -- Store secret in Firestore -- generate-2fa-secret.ts
//login/page.tsx

import type { NextApiRequest, NextApiResponse } from "next";

import speakeasy from "speakeasy";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { token, secret, uid } = req.body;

  if (!token || !secret || !uid) {
    return res.status(400).json({ error: "Missing token, secret, or uid" });
  }

  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });

  if (!verified) {
    return res.status(200).json({ verified: false });
  }

  try {
    // 🔍 Query for employee document where field `uid` matches
    const employeeQuery = query(
      collection(db, "employees"),
      where("uid", "==", uid)
    );
    const snapshot = await getDocs(employeeQuery);

    if (snapshot.empty) {
      return res.status(404).json({ error: "Employee document not found" });
    }

    // ✅ Update the first matching doc
    const docRef = doc(db, "employees", snapshot.docs[0].id);
    await updateDoc(docRef, {
    mfaVerified: true,
    mfaVerifiedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours ahead
    mfaSecret: secret,
    });

    return res.status(200).json({ verified: true });
  } catch (err) {
    console.error("❌ Firestore update failed:", err);
    return res.status(500).json({ error: "Firestore update failed" });
  }
}
