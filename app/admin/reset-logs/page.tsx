// ✅ File: app/admin/reset-logs/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ResetLog {
  id: string;
  email: string;
  resetAt: string;
  passwordStrength: string;
}

export default function ResetLogsPage() {
  const [logs, setLogs] = useState<ResetLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const q = query(
        collection(db, "password-reset-logs"),
        orderBy("resetAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data: ResetLog[] = snapshot.docs.map((doc) => {
        const log = doc.data();
        return {
          id: doc.id,
          email: log.email,
          passwordStrength: log.passwordStrength,
          resetAt: new Date(log.resetAt.seconds * 1000).toLocaleString(),
        };
      });
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold mb-4">🔐 Password Reset Logs</h1>
      {loading ? (
        <p className="text-sm">Loading reset logs...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm">No reset logs found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow">
            <thead className="bg-gray-200 dark:bg-gray-700 text-sm">
              <tr>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Reset Time</th>
                <th className="p-3 text-left">Strength</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-t hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <td className="p-3">{log.email}</td>
                  <td className="p-3">{log.resetAt}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        log.passwordStrength === "Strong"
                          ? "bg-green-100 text-green-800"
                          : log.passwordStrength === "Moderate"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.passwordStrength}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
