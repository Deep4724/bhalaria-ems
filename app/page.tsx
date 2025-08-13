"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Always go to login page first
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-700 text-lg">
      🔒 Redirecting to login...
    </div>
  );
}
