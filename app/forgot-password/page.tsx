// ✅ File: app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";
import { FirebaseError } from "firebase/app";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  //Input validation for email
  const handleResetRequest = async () => {
    if (!email || !email.includes("@") || email.length < 5) {
      toast.error("Enter a valid email address");
      return;
    }
    try {
      setLoading(true);
      //Sends the E-mail
      await sendPasswordResetEmail(auth, email); //check by auth that user exist in database
      toast.success("✅ Reset link sent! Check your inbox");
      setEmail("");
    } catch (err: unknown) {
      const error = err as FirebaseError;
      console.error("Reset error:", error);

      switch (error.code) {
        case "auth/user-not-found":
          toast.error("❌ Email not found");
          break;
        case "auth/invalid-email":
          toast.error("❌ Invalid email format");
          break;
        case "auth/too-many-requests":
          toast.error("⚠️ Too many attempts, try again later");
          break;
        default:
          toast.error("❌ Failed to send reset link");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full shadow">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">
          🔑 Forgot Password?
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
        />

        <button
          onClick={handleResetRequest}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p className="text-xs text-center mt-4 text-gray-500 dark:text-gray-400">
          <a
            href="/login"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
}
