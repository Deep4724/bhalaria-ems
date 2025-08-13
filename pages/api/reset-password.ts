// Remove "use client" -- API routes are always server-side!
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";
// import bcrypt from "bcryptjs"; // <- If you want to hash passwords

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password." });
  }

  try {
    const q = query(collection(db, "employees"), where("email", "==", email));
    const snap = await getDocs(q);

    if (snap.empty) {
      return res.status(404).json({ error: "User not found." });
    }

    const userDoc = snap.docs[0].ref;

    // // For production: hash the password first!
    // const hashedPassword = await bcrypt.hash(password, 10);

    await updateDoc(userDoc, {
      // password: hashedPassword, // For production
      password, // For demo only
    });

    return res.status(200).json({ message: "Password updated." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Failed to reset password." });
  }
}
