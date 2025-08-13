"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  HiOutlineHome,
  HiOutlineClipboardList,
  HiOutlineBriefcase,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlineLogout,
  HiMenuAlt3,
  HiOutlineUsers,
} from "react-icons/hi";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const links = [
  { name: "Dashboard", href: "/hr/dashboard", icon: <HiOutlineHome /> },
  { name: "Payroll", href: "/hr/payroll", icon: <HiOutlineClipboardList /> },
  { name: "Post Jobs", href: "/hr/jobs", icon: <HiOutlineBriefcase /> },
  { name: "Policies", href: "/hr/policies", icon: <HiOutlineDocumentText /> },
  {
    name: "Job Applications",
    href: "/hr/jobapplications",
    icon: <HiOutlineUserGroup />,
  },
  { name: "Employees", href: "/hr/employees", icon: <HiOutlineUsers /> },
  { name: "Profile", href: "/hr/profile", icon: <HiOutlineUsers /> },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div
      className={`fixed md:relative z-50 transition-all duration-300 min-h-screen border-r border-gray-200 dark:border-gray-700
        ${open ? "w-64" : "w-20"} bg-white dark:bg-slate-900`}
    >
      {/* Top section */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-700 dark:text-gray-300 text-2xl"
        >
          <HiMenuAlt3 />
        </button>
        {open && (
          <h1 className="text-lg font-bold tracking-wide text-blue-600 dark:text-blue-400">
            Bhalaria Works
          </h1>
        )}
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-4 py-6 space-y-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-white"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
              }`}
            >
              <span className="text-xl">{link.icon}</span>
              {open && <span>{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout section */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 text-sm text-red-500 hover:text-red-600"
        >
          <HiOutlineLogout className="text-lg" />
          {open && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
