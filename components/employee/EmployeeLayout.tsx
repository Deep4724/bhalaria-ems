"use client";

import { useState } from "react";
import { FaBars } from "react-icons/fa";
import EmployeeSidebar from "./employee-sidebar";

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar (mobile toggle + desktop always visible) */}
      <div
        className={`fixed inset-0 z-40 md:static md:translate-x-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300`}
      >
        <EmployeeSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 shadow-md md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 dark:text-gray-300"
          >
            <FaBars size={20} />
          </button>
          <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">
            Bhalaria Works
          </h1>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}