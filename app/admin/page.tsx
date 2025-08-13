"use client"; // ✅ Required for client-side navigation and RoleGuard to work

import RoleGuard from "@/components/RoleGuard"; // 🔐 Component to restrict access by user role
import { useRouter } from "next/navigation"; // ⛳ Used for client-side redirection
import { useEffect } from "react";

// 📌 This is the root page for `/admin` route
// ✅ It redirects authorized users to `/admin/dashboard`
// ❌ Unauthorized users are redirected inside `RoleGuard`

export default function AdminPage() {
  return (
    // 🔐 Only allow users with role "admin" or "super-admin"
    <RoleGuard allowedRoles={["admin", "super-admin"]}>
      <Redirector />
    </RoleGuard>
  );
}

// 🚀 This component handles redirection after role validation
function Redirector() {
  const router = useRouter();

  useEffect(() => {
    // 🔁 Replace current route with /admin/dashboard once validated
    router.replace("/admin/dashboard");
  }, [router]);

  // ⛔ Don't render anything visually during redirection
  return null;
}
