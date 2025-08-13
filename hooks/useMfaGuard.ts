"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export function useMfaGuard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMfa = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }

      const ref = doc(db, "employees", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        router.push("/unauthorized");
        return;
      }

      const data = snap.data();
      if (!data.mfaVerified) {
        router.push(`/mfa-verify?uid=${user.uid}&role=${data.role}`);
      } else {
        setLoading(false);
      }
    };

    checkMfa();
  }, [router]);

  return { loading };
}
