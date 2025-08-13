// API Route for reCAPTCHA v3 verification (Pages Router)
// This file runs on the server. DO NOT expose your secret key to the browser!

import type { NextApiRequest, NextApiResponse } from "next";

// Define the expected response format from Google reCAPTCHA
interface RecaptchaResponse {
  success: boolean;     // Was the verification successful?
  score: number;        // reCAPTCHA's confidence score (0.0 = bot, 1.0 = human)
  action: string;       // Action name (e.g., 'login')
  challenge_ts: string; // Timestamp of the challenge
  hostname: string;     // Your app's hostname
}

// API handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ verified: boolean; score: number }>
) {
  // Only allow POST requests for this API
  if (req.method !== "POST") {
    // Method Not Allowed
    return res.status(405).json({ verified: false, score: 0 });
  }

  // Extract the token sent from the client
  const { token } = req.body;

  // If no token provided, return error
  if (!token) {
    return res.status(400).json({ verified: false, score: 0 });
  }

  try {
    // reCAPTCHA secret key (set in your .env file, never exposed to client)
    const secretKey = process.env.RECAPTCHA_SECRET_KEY!;

    // Send verification request to Google reCAPTCHA API
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        // URL-encoded form data: secret (private) and the token received from client
        body: new URLSearchParams({
          secret: secretKey,
          response: token,
        }).toString(),
      }
    );

    // Parse the response from Google
    const data: RecaptchaResponse = await response.json();

    // Consider user verified if success is true and score is at least 0.5
    const verified = data.success && data.score >= 0.5;

    // Return verification result and the score to the frontend
    return res.status(200).json({ verified, score: data.score });
  } catch (error) {
    // If any error occurs (e.g., network), log and respond with failure
    console.error("Captcha verification error:", error);
    return res.status(500).json({ verified: false, score: 0 });
  }
}
