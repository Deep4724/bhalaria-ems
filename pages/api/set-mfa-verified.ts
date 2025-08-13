///api/set-mfa-verified.ts
//↓
//Allow access to dashboard



// D:\admin\admin\pages\api\set-mfa-verified.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { auth } from "@/lib/firebase-admin";

//  Strict type for request body
interface RequestBody {
  uid: string;
}

//  Strict response shape
interface ApiResponse {
  message: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { uid } = req.body as RequestBody;

  if (!uid) {
    return res.status(400).json({ message: "Missing UID" });
  }

  try {
    //  Set the custom claim
    await auth.setCustomUserClaims(uid, { mfaVerified: true });
    return res.status(200).json({ message: "✅ mfaVerified claim set." });
  } catch (error) {
    console.error("❌ Error setting claim:", error);
    return res.status(500).json({ message: "❌ Failed to set claim" });
  }
}
