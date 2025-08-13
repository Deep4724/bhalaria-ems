"use client";

import { useEffect, useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";

interface DashboardStats {
  attendanceRate: number;
  pendingLeaves: number;
  assignedProjects: number;
  messageCount: number;
}

export default function EmployeeDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const uid = user.uid;
      const current = new Date();
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const nextMonth = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        1
      );

      const attendanceSnap = await getDocs(
        query(collection(db, "attendance-records"), where("uid", "==", uid))
      );

      const thisMonthRecords = attendanceSnap.docs.filter((doc) => {
        const data = doc.data();
        const date = new Date(data.date);
        return (
          date >= monthStart &&
          date < nextMonth &&
          data.clockIn &&
          data.clockOut
        );
      });

      const presentDays = new Set(
        thisMonthRecords.map((doc) => doc.data().date)
      );

      const totalWorkingDays = Array.from({ length: 31 }, (_, i) => {
        const d = new Date(current.getFullYear(), current.getMonth(), i + 1);
        return (
          d.getMonth() === current.getMonth() &&
          d.getDay() !== 0 &&
          d.getDay() !== 6
        );
      }).filter(Boolean).length;

      const attendanceRate = (presentDays.size / totalWorkingDays) * 100;

      const leaveSnap = await getDocs(
        query(
          collection(db, "leave-requests"),
          where("uid", "==", uid),
          where("status", "==", "Pending")
        )
      );

      const projSnap = await getDocs(
        query(
          collection(db, "projects"),
          where("assignedTo", "array-contains", uid)
        )
      );

      const messageCount = 3; // Static for now

      setStats({
        attendanceRate: Math.round(attendanceRate),
        pendingLeaves: leaveSnap.size,
        assignedProjects: projSnap.size,
        messageCount,
      });
    };

    fetchStats();
  }, []);

  if (!stats)
    return (
      <p className="p-6 text-gray-700 dark:text-white">
        Loading your dashboard...
      </p>
    );

  return (
    <RoleGuard allowedRoles={["employee"]}>
      <div className="p-4 text-gray-900 dark:text-white">
        <h1 className="text-2xl font-bold">Employee Dashboard</h1>
        <div>
          <h1 className="text-3xl font-bold mb-6 text-blue-600 dark:text-blue-400">
            Welcome to Employee Panel
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Attendance",
                value: `${stats.attendanceRate}%`,
                href: "/employee/attendance-history",
              },
              {
                title: "Pending Leaves",
                value: stats.pendingLeaves,
                href: "/employee/leave",
              },
              {
                title: "Projects",
                value: stats.assignedProjects,
                href: "/employee/projects",
              },
              {
                title: "Messages",
                value: stats.messageCount,
                href: "/employee/profile",
              },
            ].map((card, idx) => (
              <div
                key={idx}
                onClick={() => router.push(card.href)}
                className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition"
              >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
