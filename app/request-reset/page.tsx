// ✅ File: app/request-reset/page.tsx
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase"; // ✅ Make sure this line is present and correct

export default function RequestResetFallbackPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const sendResetLink = async () => {
    if (!email.includes("@") || email.length < 5) {
      toast.error("Enter a valid email");
      return;
    }

    try {
      setSending(true);
      // sends the EMAIL
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/reset-password`, // optional: custom redirect
      });
      toast.success("Email sent! Check your inbox");
      setEmail("");
    } catch (err) {
      toast.error("Email send failed");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-6 max-w-md w-full rounded shadow">
        <h2 className="text-xl font-bold text-center mb-4 dark:text-white">
          ✉️ Request Reset Link
        </h2>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
          placeholder="Enter your email"
        />

        <button
          onClick={sendResetLink}
          disabled={sending}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          {sending ? "Sending..." : "Send via EmailJS"}
        </button>

        <p className="mt-4 text-xs text-gray-500 text-center dark:text-gray-400">
          Use this method if Firebase reset isn`&apos;`t working.
        </p>
      </div>
    </div>
  );
}
