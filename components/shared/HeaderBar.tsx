// ✅ HeaderBar.tsx — top admin navigation bar with theme toggle
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
// import { FaBell, FaUserCircle } from "react-icons/fa";

export default function HeaderBar() {
  const {} = useTheme();
  const [mounted, setMounted] = useState(false);

  // ✅ Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // 🚫 Don't render until mounted on client

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2 shadow-sm flex items-center justify-between">
      {/* ✅ Left: App Name or Search */}
      <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
        Admin Panel
      </div>

      {/* ✅ Right: Icons */}
      <div className="flex items-center gap-4">
        {/* 🔔 Notification bell */}
        {/* <button className="text-gray-600 dark:text-gray-300 hover:text-blue-600">
          <FaBell size={18} />
        </button> */}

        {/* 👤 User icon */}
        {/* <div className="text-gray-700 dark:text-gray-200">
          <FaUserCircle size={22} />
        </div> */}

        {/* 🌗 Dark mode toggle */}
        {/* <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="ml-2 text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button> */}
      </div>
    </header>
  );
}
