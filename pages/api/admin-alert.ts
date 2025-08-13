// pages/api/admin-alert.ts

import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  const { email, reason } = req.body as { email: string; reason: string };

  if (!email || !reason) return res.status(400).json({ error: "Missing fields" });

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_ALERT_EMAIL,
        pass: process.env.ADMIN_ALERT_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Bhalaria Alert" <${process.env.ADMIN_ALERT_EMAIL}>`,
      to: process.env.ADMIN_RECEIVER_EMAIL,
      subject: "⚠️ OTP Failure Alert",
      text: `User with email ${email} failed OTP verification 3 times.\nReason: ${reason}`,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Admin alert error:", err);
    res.status(500).json({ error: "Failed to send admin alert." });
  }
}
