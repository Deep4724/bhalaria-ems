"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getDocs, collection, query, where } from "firebase/firestore";

// 🎯 Props
interface RoleGuardProps {
  allowedRoles: string[]; // e.g., ["admin", "super-admin"]
  children: React.ReactNode;
}

// 🔐 Protects pages based on role + Firestore mfaVerified field
export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("❌ No user logged in");
        router.push("/login");
        return;
      }

      try {
        // 🔍 Fetch employee data by UID
        const q = query(
          collection(db, "employees"),
          where("uid", "==", user.uid)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          console.warn("❌ UID not found in employees");
          router.push("/unauthorized");
          return;
        }

        const userData = snapshot.docs[0].data();
        const role =
          userData.role?.toString().trim().toLowerCase() ?? "unknown";
        const mfaVerified = userData.mfaVerified ?? false;
        const mfaVerifiedUntil = userData.mfaVerifiedUntil?.toDate?.() ?? null;
        const now = new Date();

        console.log("👤 UID:", user.uid);
        console.log("🎭 Role:", role);
        console.log("🔐 MFA Verified:", mfaVerified);
        console.log("⏰ Verified Until:", mfaVerifiedUntil);

        // ✅ Check if role is allowed
        const allowed = allowedRoles.map((r) => r.toLowerCase());
        if (!allowed.includes(role)) {
          console.warn("❌ Access denied: role mismatch");
          router.push("/unauthorized");
          return;
        }

        // ✅ Check if 2FA is verified and still valid
        if (!mfaVerified || !mfaVerifiedUntil || now > mfaVerifiedUntil) {
          console.warn("❌ MFA not verified or expired");
          router.push("/setup-2fa"); // Or /setup-2fa if first time
          return;
        }

        // ✅ All checks passed
        setChecking(false);
      } catch (error) {
        console.error("🔥 RoleGuard error:", error);
        router.push("/unauthorized");
      }
    });

    return () => unsubscribe();
  }, [allowedRoles, router]);

  if (checking) {
    return (
      <p className="text-center mt-10 text-gray-500 dark:text-gray-300">
        🔐 Verifying role & MFA...
      </p>
    );
  }

  return <>{children}</>;
}
