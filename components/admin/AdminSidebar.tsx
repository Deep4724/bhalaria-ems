"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FaTachometerAlt,
  FaUsers,
  FaCalendarCheck,
  FaClipboardList,
  FaUserShield,
  FaFolderOpen,
  FaUserPlus,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// ✅ Props interface
interface AdminSidebarProps {
  onClose?: () => void;
}

export default function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      const q = query(
        collection(db, "leave-requests"),
        where("status", "==", "Pending")
      );
      const snapshot = await getDocs(q);
      setPendingCount(snapshot.size);
    };
    fetchPending();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAdminLoggedIn");
    router.push("/login");
  };

  const linkClasses = (path: string) =>
    `flex items-center gap-2 p-3 rounded-lg ${
      pathname?.startsWith(path)
        ? "bg-blue-100 text-blue-700 font-semibold"
        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;

  return (
    <aside className="fixed top-0 left-0 w-64 h-full bg-white shadow-lg dark:bg-gray-800 p-6 overflow-y-auto z-50">
      {/* Optional mobile close button */}
      {onClose && (
        <div className="flex justify-end mb-2 md:hidden">
          <button
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-500"
            aria-label="Close Sidebar"
          >
            <FaTimes size={20} />
          </button>
        </div>
      )}

      {/* Brand title */}
      <div className="text-xl font-bold text-blue-600 px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-center sticky top-0 bg-white dark:bg-gray-800 z-10">
        Bhalaria Works
      </div>

      {/* Navigation links */}
      <nav className="flex flex-col space-y-3 mt-6">
        <Link
          href="/admin/dashboard"
          className={linkClasses("/admin/dashboard")}
        >
          <FaTachometerAlt /> Dashboard
        </Link>

        <Link
          href="/admin/employees"
          className={linkClasses("/admin/employees")}
        >
          <FaUsers /> Employee Directory
        </Link>

        <Link
          href="/admin/attendance"
          className={linkClasses("/admin/attendance")}
        >
          <FaCalendarCheck /> Attendance
        </Link>

        <Link href="/admin/leaves" className={linkClasses("/admin/leaves")}>
          <div className="relative flex items-center gap-2 w-full">
            <FaClipboardList />
            <span>Leave Requests</span>
            {pendingCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
        </Link>

        <Link href="/admin/roles" className={linkClasses("/admin/roles")}>
          <FaUserShield /> Role Management
        </Link>

        <Link href="/admin/projects" className={linkClasses("/admin/projects")}>
          <FaFolderOpen /> Projects
        </Link>

        <Link
          href="/admin/create-user"
          className={linkClasses("/admin/create-user")}
        >
          <FaUserPlus /> Create User
        </Link>

        <Link href="/admin/profile" className={linkClasses("/admin/profile")}>
          <FaUserShield /> Profile
        </Link>

        <Link
          href="/admin/settings/security"
          className={linkClasses("/admin/settings")}
        >
          <FaUserShield /> Settings
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-lg mt-10"
        >
          <FaSignOutAlt /> Logout
        </button>
      </nav>
    </aside>
  );
}
