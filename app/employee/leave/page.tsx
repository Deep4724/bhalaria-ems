"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { addDays, format } from "date-fns";
import { detectBadWords } from "@/lib/azureAI";

// ✅ Leave Request Type
interface LeaveRequest {
  id?: string;
  fullName: string;
  email: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: string;
  timestamp?: Timestamp;
  uid: string;
}

export default function LeavePage() {
  const auth = getAuth();
  const user = auth.currentUser;

  const [form, setForm] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    leaveType: "",
    reason: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [myLeaves, setMyLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    if (user?.uid) fetchMyLeaveRequests(user.uid);
  }, [user?.uid]);

  const isWeekday = (date: Date) => date.getDay() !== 0 && date.getDay() !== 6;
  const countWords = (text: string) =>
    text.trim().split(/\s+/).filter(Boolean).length;

  const fetchMyLeaveRequests = async (uid: string) => {
    const q = query(collection(db, "leave-requests"), where("uid", "==", uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as LeaveRequest[];
    setMyLeaves(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.startDate || !form.endDate || !form.leaveType || !form.reason) {
      setError("All fields are required.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    if (countWords(form.reason) > 30) {
      setError("Reason must be 30 words or fewer.");
      return;
    }

    const reasonText = form.reason.trim().toLowerCase();
    const hasBadWords = await detectBadWords(reasonText);
    if (hasBadWords) {
      setError("🚫 Reason contains inappropriate or abusive content.");
      return;
    }

    if (!user) {
      setError("User not logged in.");
      return;
    }

    try {
      const employeeQuery = query(
        collection(db, "employees"),
        where("uid", "==", user.uid)
      );
      const employeeSnapshot = await getDocs(employeeQuery);
      if (employeeSnapshot.empty) {
        setError("Employee data not found.");
        return;
      }

      const employee = employeeSnapshot.docs[0].data();
      const fullName = employee.fullName || employee.name || "Unknown";
      const email = employee.email || user.email || "";
      const employeeId = employee.employeeId || "";

      await addDoc(collection(db, "leave-requests"), {
        uid: user.uid,
        fullName,
        email,
        employeeId,
        type: form.leaveType,
        startDate: format(form.startDate, "yyyy-MM-dd"),
        endDate: format(form.endDate, "yyyy-MM-dd"),
        reason: form.reason.trim(),
        status: "Pending",
        timestamp: serverTimestamp(),
      });

      setSuccess("✅ Leave request submitted successfully.");
      setForm({ startDate: null, endDate: null, leaveType: "", reason: "" });
      fetchMyLeaveRequests(user.uid);
    } catch (err) {
      console.error(err);
      setError("❌ Failed to submit leave request.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-6">
        Leave Request
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm"
      >
        {/* Start Date */}
        <div>
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">
            From Date
          </label>
          <DatePicker
            selected={form.startDate}
            onChange={(date) => setForm({ ...form, startDate: date })}
            filterDate={isWeekday}
            minDate={addDays(new Date(), 1)}
            placeholderText="Select start date"
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">
            To Date
          </label>
          <DatePicker
            selected={form.endDate}
            onChange={(date) => setForm({ ...form, endDate: date })}
            filterDate={(date) =>
              isWeekday(date) && (!form.startDate || date >= form.startDate)
            }
            minDate={form.startDate || addDays(new Date(), 1)}
            placeholderText="Select end date"
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Leave Type */}
        <div>
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">
            Leave Type
          </label>
          <select
            value={form.leaveType}
            onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select type</option>
            <option value="Sick Leave">Sick Leave</option>
            <option value="Casual Leave">Casual Leave</option>
            <option value="Emergency Leave">Emergency Leave</option>
          </select>
        </div>

        {/* Reason Field with Word Count */}
        <div>
          <label className="block mb-1 font-medium text-gray-700 dark:text-gray-200">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            rows={3}
            placeholder="Max 30 words"
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
          />
          <p className="text-sm text-gray-500 mt-1">
            {countWords(form.reason)} / 30 words
          </p>
        </div>

        {/* Error & Success Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
            {success}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold"
        >
          Submit Leave Request
        </button>
      </form>

      {/* Leave History Table */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Your Leave History
        </h2>
        <div className="overflow-x-auto rounded shadow-sm">
          <table className="min-w-full table-auto text-sm border-collapse bg-white dark:bg-gray-800">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-4 py-2 text-left">From Date</th>
                <th className="px-4 py-2 text-left">To Date</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Reason</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {myLeaves.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-3 text-center text-gray-500 dark:text-gray-400"
                  >
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                myLeaves.map((leave) => (
                  <tr
                    key={leave.id}
                    className="border-t hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-2">{leave.startDate || "-"}</td>
                    <td className="px-4 py-2">{leave.endDate || "-"}</td>
                    <td className="px-4 py-2">{leave.type}</td>
                    <td className="px-4 py-2">{leave.reason}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          leave.status === "Approved"
                            ? "bg-green-100 text-green-700"
                            : leave.status === "Rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
