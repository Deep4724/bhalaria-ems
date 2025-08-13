"use client";

import { ThemeProvider } from "next-themes";
import AdminLayout from "@/components/shared/AdminLayout";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" enableSystem defaultTheme="system">
      {/* ✅ Move all Tailwind base classes here, not on <body> */}
      <div className="bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white min-h-screen">
        <AdminLayout>{children}</AdminLayout>
      </div>
    </ThemeProvider>
  );
}
