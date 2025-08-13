"use client";

import { ReactNode, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import EmployeeSidebar from "@/components/employee/employee-sidebar";
import { FaBars } from "react-icons/fa";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RoleGuard allowedRoles={["employee"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 w-64 z-40 transform transition-transform duration-300 md:relative md:translate-x-0
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }`}
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
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Mobile top bar */}
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
          <main className="p-6 w-full">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}