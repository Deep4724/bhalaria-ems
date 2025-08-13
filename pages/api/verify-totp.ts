///api/verify-totp.ts
//IF Code is correct
///api/set-mfa-verified.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import * as speakeasy from "speakeasy"; //


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, uid } = req.body;

  if (!code || !uid) {
    return res.status(400).json({ error: "Missing code or uid" });
  }
  
  const q = query(collection(db, "employees"), where("uid", "==", uid));
  const snap = await getDocs(q);
  if (snap.empty) return res.status(404).json({ error: "User not found" });

  const user = snap.docs[0].data();

  if (!user.tempSecret) return res.status(400).json({ error: "2FA not configured" });

  const verified = speakeasy.totp.verify({
    secret: user.tempSecret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  return res.status(200).json({ valid: verified });
}
