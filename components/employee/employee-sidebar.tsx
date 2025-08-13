"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FaTachometerAlt,
  FaSuitcase,
  FaTasks,
  FaUserCircle,
  FaSignOutAlt,
  FaClock,
  FaBriefcaseMedical,
  FaFileInvoiceDollar,
  FaClipboardList,
  FaHistory,
  FaFolderOpen,
  FaTimes,
} from "react-icons/fa";

interface EmployeeSidebarProps {
  onClose?: () => void; // Optional close button handler for mobile
}

export default function EmployeeSidebar({ onClose }: EmployeeSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("isEmployeeLoggedIn");
    router.push("/login");
  };

  const linkClasses = (path: string, exact: boolean = false) =>
    `flex items-center gap-2 p-3 rounded-lg transition-colors duration-200 ${
      exact
        ? pathname === path
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-semibold"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        : pathname === path || pathname?.startsWith(path + "/")
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-semibold"
        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
    }`;

  return (
    <aside className="fixed top-0 left-0 w-64 h-full bg-white dark:bg-gray-900 shadow-lg p-6 overflow-y-auto z-50 transition-transform duration-300">
      {/* Mobile Close Button */}
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

      {/* Header */}
      <div className="text-xl font-bold text-blue-600 dark:text-blue-400 px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-center sticky top-0 bg-white dark:bg-gray-900 z-10">
        Bhalaria Works
      </div>

      {/* Navigation */}
      <nav className="flex flex-col space-y-3 mt-4">
        <Link href="/employee" className={linkClasses("/employee", true)}>
          <FaTachometerAlt /> Dashboard
        </Link>

        <Link
          href="/employee/attendance-history"
          className={linkClasses("/employee/attendance-history", true)}
        >
          <FaHistory /> Attendance History
        </Link>

        <Link
          href="/employee/leave"
          className={linkClasses("/employee/leave", true)}
        >
          <FaSuitcase /> Leave
        </Link>

        <Link
          href="/employee/projects"
          className={linkClasses("/employee/projects", true)}
        >
          <FaTasks /> Projects
        </Link>

        <Link
          href="/employee/clock"
          className={linkClasses("/employee/clock", true)}
        >
          <FaClock /> Clock In/Out
        </Link>

        <Link
          href="/employee/benefits"
          className={linkClasses("/employee/benefits", true)}
        >
          <FaBriefcaseMedical /> Benefits
        </Link>

        <Link
          href="/employee/paystub"
          className={linkClasses("/employee/paystub", true)}
        >
          <FaFileInvoiceDollar /> Pay Stub
        </Link>

        <Link
          href="/employee/job"
          className={linkClasses("/employee/job", true)}
        >
          <FaClipboardList /> Job Post
        </Link>

        <Link
          href="/employee/job/my-application"
          className={linkClasses("/employee/job/my-application", true)}
        >
          <FaFolderOpen /> My Applications
        </Link>

        <Link
          href="/employee/profile"
          className={linkClasses("/employee/profile", true)}
        >
          <FaUserCircle /> Profile
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg mt-10 transition-colors duration-200"
        >
          <FaSignOutAlt /> Logout
        </button>
      </nav>
    </aside>
  );
}