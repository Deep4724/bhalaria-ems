"use client";

import { ReactNode, useState } from "react";
import AdminSidebar from "@/components/admin/Sidebar";
import Navbar from "@/components/Navbar";

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      {/* Sidebar (mobile slide & desktop static) */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out
        ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative md:block`}
      >
        <AdminSidebar onClose={() => setShowSidebar(false)} />
      </div>

      {/* Mobile overlay when sidebar is open */}
      {showSidebar && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main content section */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Navbar with toggle handler (no dark mode button inside Navbar anymore) */}
        <Navbar onToggleSidebarAction={() => setShowSidebar(!showSidebar)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 text-gray-800 dark:text-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}
