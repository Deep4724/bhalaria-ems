
import type { NextApiRequest, NextApiResponse } from "next";

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { uid } = req.body;

  if (!uid) {
    return res.status(400).json({ error: "Missing UID" });
  }

  try {
    const q = query(collection(db, "employees"), where("uid", "==", uid));
    const snap = await getDocs(q);

    if (snap.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const data = snap.docs[0].data();
    return res.status(200).json({ role: data.role || "employee" });
  } catch (err) {
    console.error("Error fetching role:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
