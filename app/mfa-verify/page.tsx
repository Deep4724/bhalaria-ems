//User enters code
//->
///api/verify-totp.ts

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function MFAVerifyPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  useEffect(() => {
    const checkMFA = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const ref = doc(db, "employees", currentUser.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const data = snap.data();
      setMfaEnabled(!!data.mfaSecret);

      if (data.mfaVerified === true) {
        // ✅ Inline redirectByRole logic here to avoid eslint warning
        const role = data.role;
        switch (role) {
          case "admin":
          case "super-admin":
            router.push("/admin/dashboard");
            break;
          case "hr":
            router.push("/hr/dashboard");
            break;
          case "employee":
          default:
            router.push("/employee/dashboard");
            break;
        }
      }
    };

    checkMFA();
  }, [router]);

  const redirectByRole = (role: string) => {
    switch (role) {
      case "admin":
      case "super-admin":
        router.push("/admin/dashboard");
        break;
      case "hr":
        router.push("/hr/dashboard");
        break;
      case "employee":
      default:
        router.push("/employee/dashboard");
        break;
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    const currentUser = auth.currentUser;

    if (!currentUser) {
      toast.error("User not authenticated.");
      setLoading(false);
      return;
    }

    try {
      toast.success(" Verified successfully! Redirecting...");

      const res = await fetch("/api/get-user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: currentUser.uid }),
      });

      const { role } = await res.json();

      setTimeout(() => {
        redirectByRole(role);
      }, 2000);
    } catch (err) {
      console.error("2FA Verify failed:", err);
      toast.error("Failed to verify.");
    } finally {
      setLoading(false);
    }
  };

  if (!mfaEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white shadow-xl p-6 rounded-lg text-center">
          <h1 className="text-xl font-bold mb-4">2FA Not Setup</h1>
          <p className="text-gray-500 mb-2">Please setup 2FA first.</p>
          <button
            onClick={() => router.push("/setup-2fa")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Setup 2FA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg p-8 rounded-xl w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Verify 2FA</h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter the 6-digit code from your authenticator app
        </p>

        <input
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="123456"
          className="w-full px-4 py-3 text-center border border-gray-300 rounded-md shadow-sm font-mono text-xl tracking-widest mb-4"
        />

        <button
          onClick={handleVerify}
          disabled={loading}
          className={`w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Bhalaria Works • Secure Access
        </p>
      </div>
    </div>
  );
}
