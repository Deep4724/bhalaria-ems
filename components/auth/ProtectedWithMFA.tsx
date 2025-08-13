// ✅ D:\admin\admin\components\auth\ProtectedWithMFA.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import toast from "react-hot-toast";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedWithMFA({ children }: Props) {
  const router = useRouter();

  useEffect(() => {
    const checkMFA = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        router.replace("/login");
        return;
      }

      const token = await user.getIdTokenResult(true); // Force refresh
      const mfaVerified = token.claims?.mfaVerified;

      if (!mfaVerified) {
        toast("🔐 2FA is required. Redirecting...");
        router.replace("/setup-2fa");
      }
    };

    checkMFA();
  }, [router]);

  return <>{children}</>;
}
