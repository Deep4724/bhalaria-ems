"use client";

import RoleGuard from "@/components/RoleGuard";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HRPage() {
  return (
    <RoleGuard allowedRoles={["hr"]}>
      <Redirector />
    </RoleGuard>
  );
}

function Redirector() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/hr/dashboard");
  }, [router]);

  return null;
}
