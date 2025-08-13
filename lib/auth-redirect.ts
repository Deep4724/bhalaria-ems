import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase";
import { getDocs, query, where, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useRoleRedirect() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const q = query(collection(db, "employees"), where("email", "==", user.email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          console.warn("No user record found in employees collection");
          return;
        }

        const userData = snapshot.docs[0].data();
        const role = userData.role;

        // Redirect based on role
        switch (role) {
          case "Admin":
          case "Super Admin":
            router.push("/admin/dashboard");
            break;
          case "HR":
            router.push("/hr/dashboard");
            break;
          case "Employee":
            router.push("/employee/dashboard");
            break;
          default:
            console.warn("Unknown role:", role);
            break;
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    });

    return () => unsubscribe();
  }, [router]);
}
