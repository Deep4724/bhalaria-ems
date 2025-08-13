"use client";

import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ✅ Add prop type
interface NavbarProps {
  onToggleSidebarAction?: () => void;
}

export default function Navbar({ onToggleSidebarAction }: NavbarProps) {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const fetchUserInfo = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "employees"),
        where("uid", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setUserName(data.name || "");
        setUserRole(data.role || "");
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-30 px-4 py-2 flex justify-between items-center">
      {/* 📱 Mobile toggle button (visible on small screens only) */}
      <button
        onClick={onToggleSidebarAction}
        className="md:hidden text-gray-700 dark:text-white p-2"
        aria-label="Toggle sidebar"
      >
        ☰
      </button>

      {/* 🌐 App Name */}
      <div className="text-xl font-semibold text-blue-600">Bhalaria Admin</div>

      {/* 👤 User Info Section */}
      <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-white">
        <span>{userName}</span>

        <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs font-semibold capitalize">
          {userRole}
        </span>

        <button
          onClick={handleLogout}
          className="bg-white text-blue-600 px-3 py-1 rounded font-medium hover:bg-gray-100 transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
