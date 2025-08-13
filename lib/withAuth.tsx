"use client";

import { useEffect, useState, ComponentType } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

// Properly type the HOC
export function withAuth<T extends object>(
  Component: ComponentType<T>,
  allowedRoles: string[]
): React.FC<T> {
  return function ProtectedComponent(props: T) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          router.push("/login");
          return;
        }

        const q = query(
          collection(db, "employees"),
          where("uid", "==", user.uid)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          router.push("/unauthorized");
          return;
        }

        const userDoc = snapshot.docs[0].data();
        const role = userDoc.role;

        if (allowedRoles.includes(role)) {
          setAuthorized(true);
        } else {
          router.push("/unauthorized");
        }

        setLoading(false);
      });

      return () => unsubscribe();
    }, [router]);

    if (loading) return <div className="p-6">🔐 Checking access...</div>;
    if (!authorized) return null;

    return <Component {...props} />;
  };
}
