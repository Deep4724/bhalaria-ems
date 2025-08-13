// pages/api/generate-2fa-secret.ts

import type { NextApiRequest, NextApiResponse } from "next";

import speakeasy from "speakeasy";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ✅ Create a TOTP secret
  const secret = speakeasy.generateSecret({
    name: "Bhalaria Works 2FA",
  });

  res.status(200).json({
    otpauth_url: secret.otpauth_url,
    base32: secret.base32, // to be used for verification
  });
}
