// pages/api/send-otp.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import nodemailer from "nodemailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // ✅ Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // ✅ Store OTP in Firestore
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)); // expires in 5 minutes

  const docRef = doc(collection(db, "otp-verification"), email);
  await setDoc(docRef, {
    email,
    otp,
    createdAt: Timestamp.now(),
    expiresAt,
    attempts: 0,
    isBlocked: false,
  });

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Bhalaria Works" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Your OTP for Login Verification",
      html: `<p>Your one-time login code is: <strong>${otp}</strong><br/>This code will expire in 5 minutes.</p>`,
    });

    return res.status(200).json({ message: "OTP sent" });
  } catch (error) {
    console.error("❌ Failed to send OTP:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
