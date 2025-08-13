// app/login/page.tsx

//If 2FA enabled → /mfa-verify

"use client";

import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { HiLockClosed, HiEye, HiEyeOff } from "react-icons/hi";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // 👇 NEW: All blocking is tracked only in localStorage
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const emailKey = email.toLowerCase().trim();
    const attemptsKey = `loginAttempts:${emailKey}`;
    const blockKey = `blocked:${emailKey}`;

    const attempts = Number(localStorage.getItem(attemptsKey)) || 0;
    const isBlocked = localStorage.getItem(blockKey) === "1";

    if (isBlocked) {
      setError(
        "This account has been blocked after 3 failed login attempts on this device. Please contact your administrator."
      );
      return;
    }

    try {
      if (!window.grecaptcha || !process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
        setError("reCAPTCHA not loaded. Please refresh.");
        return;
      }

      const token = await window.grecaptcha.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
        { action: "login" }
      );

      const verifyRes = await fetch("/api/verify-captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const verifyData: { verified: boolean; score: number } =
        await verifyRes.json();

      if (!verifyData.verified) {
        setError("Bot detection failed. Try again.");
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // ✅ Login success: Clear attempts & blocked for this email
      localStorage.removeItem(attemptsKey);
      localStorage.removeItem(blockKey);

      const q = query(collection(db, "employees"), where("uid", "==", uid));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("User not found in database.");
        return;
      }

      const userRef = snap.docs[0].ref;
      const userData = snap.docs[0].data();
      const role = userData.role as string;
      const mfaEnabled = Boolean(userData.mfaEnabled);
      const mfaVerified = Boolean(userData.mfaVerified);
      const lastVerifiedAt = userData.lastVerifiedAt as string | undefined;

      if (mfaEnabled && !userData.mfaSecret) {
        router.push("/setup-2fa");
        return;
      }

      if (mfaEnabled) {
        await updateDoc(userRef, { mfaVerified: false });
      }

      const needsMfa =
        mfaEnabled &&
        (!mfaVerified ||
          (lastVerifiedAt &&
            Date.now() - new Date(lastVerifiedAt).getTime() >
              1000 * 60 * 60 * 24));

      if (needsMfa) {
        router.push(`/mfa-verify?uid=${uid}&role=${role}`);
        return;
      }

      if (role === "admin" || role === "super-admin") {
        router.push("/admin/dashboard");
      } else if (role === "hr") {
        router.push("/hr/dashboard");
      } else {
        router.push("/employee");
      }
    } catch (err) {
      // ❌ Login failed: increment attempts for this email
      const nextAttempts = attempts + 1;
      console.error(err);
      localStorage.setItem(attemptsKey, String(nextAttempts));
      if (nextAttempts >= 3) {
        localStorage.setItem(blockKey, "1");
        setError(
          "This account has been blocked after 3 failed login attempts on this device. Please contact your administrator."
        );
      } else {
        setError(
          `❌ Invalid credentials (${nextAttempts}/3). Account will be blocked after 3 failed attempts.`
        );
      }
    }
  };

  return (
    <>
      <Head>
        <script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          async
          defer
        />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-slate-900 to-blue-900 px-4">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-4xl flex justify-center text-blue-600">
              <HiLockClosed />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mt-2">
              Bhalaria Works Login
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                placeholder="hr@bhalaria.com"
              />
            </div>

            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-800"
                tabIndex={-1}
              >
                {showPassword ? <HiEyeOff /> : <HiEye />}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center whitespace-pre-line">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md shadow-md"
            >
              Log In
            </button>
          </form>

          <p className="mt-4 text-xs text-center">
            <a
              href="/forgot-password"
              className="text-blue-500 hover:underline"
            >
              Forgot your password?
            </a>
          </p>

          <p className="mt-4 text-xs text-gray-400 text-center">
            Bhalaria Works • Secure Login
          </p>
        </div>
      </div>
    </>
  );
}

declare global {
  interface Window {
    grecaptcha: {
      execute: (
        siteKey: string,
        options: { action: string }
      ) => Promise<string>;
    };
  }
}
