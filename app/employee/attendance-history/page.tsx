"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { CSVLink } from "react-csv";

interface AttendanceRecord {
  id: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  markedAt: Timestamp;
  markedBy: string;
  fullName: string;
  employeeId: string;
}

export default function AttendanceHistoryPage() {
  const [user] = useAuthState(auth);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const empSnap = await getDocs(
        query(collection(db, "employees"), where("uid", "==", user.uid))
      );
      const empData = empSnap.docs[0]?.data();
      const fullName = empData?.fullName || empData?.name || "Unknown";
      const employeeId = empData?.employeeId || "--";

      const q = query(
        collection(db, "attendance-records"),
        where("uid", "==", user.uid),
        orderBy("markedAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          date: d.date,
          clockIn: d.clockIn || "--",
          clockOut: d.clockOut || "--",
          markedAt: d.markedAt,
          markedBy: d.markedBy,
          fullName,
          employeeId,
        };
      });

      setRecords(data);
    };

    fetchData();
  }, [user]);

  const filtered = records.filter((rec) => {
    const recDate = new Date(rec.date);
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    return (!from || recDate >= from) && (!to || recDate <= to);
  });

  const csvData = filtered.map((rec) => ({
    Name: rec.fullName,
    ID: rec.employeeId,
    Date: rec.date,
    "Clock In": rec.clockIn,
    "Clock Out": rec.clockOut,
    "Marked At": rec.markedAt.toDate().toLocaleString(),
    "Marked By": rec.markedBy,
  }));

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">
        📄 Attendance History
      </h1>

      {/* Filters and Button */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-end">
        <div>
          <label className="block text-sm font-medium mb-1">From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border p-2 rounded w-full text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border p-2 rounded w-full text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        {filtered.length > 0 && (
          <CSVLink
            data={csvData}
            filename="attendance-history.csv"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
          >
            Download CSV
          </CSVLink>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 p-4 rounded shadow">
        <table className="w-full text-sm table-auto min-w-[600px]">
          <thead className="bg-gray-100 dark:bg-gray-700 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Clock In</th>
              <th className="px-4 py-2">Clock Out</th>
              <th className="px-4 py-2">Marked At</th>
              <th className="px-4 py-2">Marked By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t dark:border-gray-700">
                <td className="px-4 py-2">{r.fullName}</td>
                <td className="px-4 py-2">{r.employeeId}</td>
                <td className="px-4 py-2">{r.date}</td>
                <td className="px-4 py-2">{r.clockIn}</td>
                <td className="px-4 py-2">{r.clockOut}</td>
                <td className="px-4 py-2">
                  {r.markedAt.toDate().toLocaleString()}
                </td>
                <td className="px-4 py-2">{r.markedBy}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-6 text-gray-500 dark:text-gray-400"
                >
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
