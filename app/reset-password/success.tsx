// ✅ File: app/reset-password/success.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResetSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/login"), 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-green-600 mb-4">
          ✅ Password Updated
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Your password has been successfully updated.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You will be redirected to login shortly...
        </p>
        <a
          href="/login"
          className="inline-block mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Go to Login Now
        </a>
      </div>
    </div>
  );
}
