"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { collection, addDoc, Timestamp } from "firebase/firestore";

function SetNewPasswordPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams?.get("oobCode") ?? ""; //temporary, secret code
  const mode = searchParams?.get("mode") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("Weak");
  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mode !== "resetPassword" || !oobCode) {
      toast.error("Invalid password reset link");
      router.push("/login");
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((verifiedEmail) => {
        setEmail(verifiedEmail);
        setValid(true);
      })
      .catch(() => {
        toast.error("Expired or invalid reset link");
        router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [mode, oobCode, router]);

  const evaluateStrength = (value: string) => {
    if (
      value.length >= 12 &&
      /[A-Z]/.test(value) &&
      /\d/.test(value) &&
      /[^a-zA-Z0-9]/.test(value)
    ) {
      setPasswordStrength("Strong");
    } else if (value.length >= 8 && /\d/.test(value)) {
      setPasswordStrength("Moderate");
    } else {
      setPasswordStrength("Weak");
    }
  };

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, password);

      await addDoc(collection(db, "password-reset-logs"), {
        email,
        resetAt: Timestamp.now(),
        passwordStrength,
      });

      toast.success("Password updated successfully!");
      router.push("/login");
    } catch (err) {
      toast.error("Failed to reset password");
      console.error(err);
    }
  };

  if (loading) {
    return <p className="text-center p-6 text-gray-500">Verifying link...</p>;
  }

  if (!valid) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full shadow">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800 dark:text-white">
          🔐 Set New Password
        </h2>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
          for <strong>{email}</strong>
        </p>

        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
          New Password
        </label>
        <input
          type="password"
          className="w-full p-2 border rounded mt-1 mb-3 dark:bg-gray-700 dark:text-white"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            evaluateStrength(e.target.value);
          }}
        />

        <div className="text-xs mb-4 text-gray-500 dark:text-gray-400">
          Strength: <strong>{passwordStrength}</strong>
        </div>

        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Confirm Password
        </label>
        <input
          type="password"
          className="w-full p-2 border rounded mt-1 mb-4 dark:bg-gray-700 dark:text-white"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          onClick={handleResetPassword}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
        >
          Set Password
        </button>

        <div className="text-center mt-4">
          <a
            href="/login"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}

// **Export page with Suspense wrapper**
export default function SetNewPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <SetNewPasswordPageInner />
    </Suspense>
  );
}
