"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import HeaderBar from "@/components/shared/HeaderBar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 flex flex-col md:pl-64">
        <HeaderBar />
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
