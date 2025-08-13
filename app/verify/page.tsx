"use client";
export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<
    "idle" | "verifying" | "success" | "error" | "blocked"
  >("idle");
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("verifying");
    setError("");

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.error?.includes("blocked")) {
          setStatus("blocked");
          setError(data.error);
        } else {
          setStatus("error");
          setError(data.error || "Invalid OTP");
        }
        return;
      }

      setStatus("success");
      router.push("/reset-password?email=" + encodeURIComponent(email));
    } catch (err) {
      setStatus("error");
      console.error(err);
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-slate-900 to-blue-900 px-4">
      <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          Verify OTP
        </h2>

        <p className="text-sm text-gray-600 text-center mb-4">
          An OTP was sent to <strong>{email}</strong>. Enter it below.
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            maxLength={6}
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
          />

          <button
            type="submit"
            disabled={status === "verifying"}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md"
          >
            {status === "verifying" ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        {error && (
          <p className="text-red-600 text-sm mt-4 text-center whitespace-pre-line">
            {error}
          </p>
        )}

        {status === "blocked" && (
          <p className="text-red-700 text-center text-sm mt-4 font-semibold">
            Your account has been blocked. Please contact Admin Desk at{" "}
            <strong>AD223</strong>.
          </p>
        )}
      </div>
    </div>
  );
}

// 👇 EXPORT default page with Suspense
export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <VerifyPageContent />
    </Suspense>
  );
}
