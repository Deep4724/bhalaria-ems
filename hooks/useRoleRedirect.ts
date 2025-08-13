// hooks/useRoleRedirect.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export function useRoleRedirect() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "employees", user.uid));
        const role = userDoc.exists() ? userDoc.data().role : null;

        if (role === "admin") {
          router.replace("/admin");
        } else if (role === "employee") {
          router.replace("/employee");
        } else if (role === "hr") {
          router.replace("/hr");
        } else {
          router.replace("/unauthorized"); // or show error
        }
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  return { loading };
}
