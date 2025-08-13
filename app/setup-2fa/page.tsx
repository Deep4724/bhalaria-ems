//user scans QR & enters code
///api/verify-2fa-code.ts (verify code)
"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import Image from "next/image";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation"; // ✅ correct import

interface SetupResponse {
  otpauth_url: string;
  base32: string;
}

export default function Setup2FA() {
  const router = useRouter(); // ✅ now router will work!
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [code, setCode] = useState("");

  // ✅ Generate QR code and secret on mount
  useEffect(() => {
    const generateSecret = async () => {
      try {
        const res = await fetch("/api/generate-2fa-secret");
        const data: SetupResponse = await res.json();

        setSecret(data.base32);
        const qrImage = await QRCode.toDataURL(data.otpauth_url);
        setQrCode(qrImage);
      } catch (err) {
        console.error("❌ Failed to generate 2FA secret:", err);
        toast.error("Something went wrong.");
      }
    };

    generateSecret();
  }, []);

  // ✅ Handle verification
  const handleVerify = async () => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        toast.error("User not authenticated.");
        return;
      }

      // 🔐 Step 1: Verify 2FA code
      const verifyRes = await fetch("/api/verify-2fa-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: code,
          secret,
          uid: currentUser.uid,
        }),
      });

      const verifyData = await verifyRes.json();

      if (verifyData.verified) {
        toast.success("✅ 2FA Enabled. Redirecting...");

        // 🔍 Step 2: Get user role
        const roleRes = await fetch("/api/get-user-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: currentUser.uid }),
        });

        const { role } = await roleRes.json();

        // ⏳ Step 3: Wait 2 sec, then redirect based on role
        setTimeout(() => {
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
              router.push("/employee");
              break;
          }
        }, 2000);
      } else {
        toast.error("❌ Invalid 2FA Code");
      }
    } catch (err) {
      console.error("❌ Verification error:", err);
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-600 p-6 text-center text-white">
      <div className="bg-white text-black rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Set up 2FA</h2>
        <p className="mb-4 text-sm text-gray-600">
          Scan this QR code using <b>Google Authenticator</b> or{" "}
          <b>Microsoft Authenticator</b>.
          <br />
          <span className="block mt-1">
            Don’t have the app?&nbsp;
            <a
              href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Download Google Authenticator
            </a>
            &nbsp;or&nbsp;
            <a
              href="https://play.google.com/store/apps/details?id=com.azure.authenticator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Microsoft Authenticator
            </a>
            .
          </span>
        </p>

        {qrCode && (
          <div className="relative w-48 h-48 mx-auto mb-4">
            <Image
              src={qrCode}
              alt="2FA QR Code"
              fill
              sizes="192px"
              className="object-contain"
            />
          </div>
        )}

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter 6-digit code"
          className="w-full border rounded px-3 py-2 mb-4"
        />

        <button
          onClick={handleVerify}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
        >
          Verify & Enable 2FA
        </button>

        <button
          onClick={() => router.push("/login")}
          className="w-full mt-2 border border-gray-300 text-gray-700 py-2 px-4 rounded"
        >
          Cancel / Go Back
        </button>

        <p className="text-xs text-gray-500 mt-4">Bhalaria Works • Security</p>
      </div>
    </div>
  );
}
