import type { NextApiRequest, NextApiResponse } from "next";

const SECRET_KEY = "6LeVOZYrAAAAADt8wF1qlgserphXrb2sEyXL6-Gb";

interface ReCaptchaResponse {
  success: boolean;
  score: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Missing token" });
    }

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${SECRET_KEY}&response=${token}`,
    });

    const data = (await response.json()) as ReCaptchaResponse;

    if (data.success && data.score >= 0.5) {
      return res.status(200).json({ verified: true, score: data.score });
    } else {
      return res.status(403).json({ verified: false, score: data.score });
    }
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return res.status(500).json({ error: "Verification failed" });
  }
}
