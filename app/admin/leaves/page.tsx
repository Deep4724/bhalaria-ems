"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDoc,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast, Toaster } from "react-hot-toast";

interface LeaveRequest {
  id: string;
  uid?: string;
  fullName: string;
  email: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  timestamp?: Timestamp;
}

export default function LeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );
  const [filter, setFilter] = useState<
    "All" | "Pending" | "Approved" | "Rejected"
  >("All");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    const snapshot = await getDocs(collection(db, "leave-requests"));
    const fetched: LeaveRequest[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const id = docSnap.id;

      let fullName = data.fullName || data.name || "Unknown";
      let email = data.email || "";
      let employeeId = data.employeeId || "";

      if (data.uid) {
        const empSnap = await getDoc(doc(db, "employees", data.uid));
        if (empSnap.exists()) {
          const emp = empSnap.data();
          fullName = emp.fullName || fullName;
          email = emp.email || email;
          employeeId = emp.employeeId || employeeId;
        }
      }

      fetched.push({
        id,
        uid: data.uid,
        fullName,
        email,
        employeeId,
        startDate: data.startDate,
        endDate: data.endDate,
        type: data.type,
        reason: data.reason,
        status: data.status,
        timestamp: data.timestamp,
      });
    }

    setLeaveRequests(fetched);
  };

  const handleStatusChange = async (
    id: string,
    newStatus: "Approved" | "Rejected"
  ) => {
    await updateDoc(doc(db, "leave-requests", id), { status: newStatus });
    toast.success(`${newStatus} successfully`);
    fetchLeaveRequests();
  };

  const exportToCSV = () => {
    const headers = [
      "Full Name",
      "Email",
      "Employee ID",
      "Start Date",
      "End Date",
      "Type",
      "Status",
    ];
    const rows = leaveRequests.map((r) => [
      r.fullName,
      r.email,
      r.employeeId,
      r.startDate,
      r.endDate,
      r.type,
      r.status,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "leave_requests.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRequests = leaveRequests.filter((req) => {
    const matchesStatus = filter === "All" || req.status === filter;
    const matchesSearch =
      req.fullName.toLowerCase().includes(search.toLowerCase()) ||
      req.email.toLowerCase().includes(search.toLowerCase());
    const matchesDate =
      (!startDate || req.startDate >= startDate) &&
      (!endDate || req.endDate <= endDate);
    return matchesStatus && matchesSearch && matchesDate;
  });

  return (
    <div className="p-4 md:p-6 w-full text-gray-900 dark:text-gray-100">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-6">
        📄 Leave Requests
      </h1>

      {/* Status & Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {["All", "Pending", "Approved", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() =>
                setFilter(status as LeaveRequest["status"] | "All")
              }
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-grow border rounded px-3 py-2 text-sm min-w-[200px] bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      {/* Date & Export */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-sm font-medium">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border px-3 py-2 rounded text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <label className="text-sm font-medium">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border px-3 py-2 rounded text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
              toast("Filters cleared");
            }}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white rounded"
          >
            Clear Filters
          </button>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          Export to CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              {[
                "Employee",
                "Email",
                "From",
                "To",
                "Type",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-200"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((leave, index) => (
              <tr
                key={leave.id}
                className={`${
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-900"
                    : "bg-gray-50 dark:bg-gray-800"
                } border-t dark:border-gray-700`}
              >
                <td className="px-4 py-3">{leave.fullName}</td>
                <td className="px-4 py-3">{leave.email}</td>
                <td className="px-4 py-3">{leave.startDate}</td>
                <td className="px-4 py-3">{leave.endDate}</td>
                <td className="px-4 py-3">{leave.type}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      leave.status === "Approved"
                        ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200"
                        : leave.status === "Rejected"
                        ? "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200"
                    }`}
                  >
                    {leave.status}
                  </span>
                </td>
                <td className="px-4 py-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedRequest(leave)}
                    className="px-3 py-1 border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition rounded text-xs dark:border-blue-300 dark:text-blue-300 dark:hover:bg-blue-500 dark:hover:text-white"
                  >
                    View
                  </button>
                  {leave.status === "Pending" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(leave.id, "Approved")}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusChange(leave.id, "Rejected")}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-center text-gray-500 dark:text-gray-400 py-6"
                >
                  No leave requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-md text-gray-900 dark:text-gray-100">
            <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-400">
              Leave Request Details
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Name:</strong> {selectedRequest.fullName}
              </p>
              <p>
                <strong>Email:</strong> {selectedRequest.email}
              </p>
              <p>
                <strong>Employee ID:</strong>{" "}
                {selectedRequest.employeeId || "N/A"}
              </p>
              <p>
                <strong>From:</strong> {selectedRequest.startDate}
              </p>
              <p>
                <strong>To:</strong> {selectedRequest.endDate}
              </p>
              <p>
                <strong>Type:</strong> {selectedRequest.type}
              </p>
              <p>
                <strong>Status:</strong> {selectedRequest.status}
              </p>
              <p>
                <strong>Reason:</strong> {selectedRequest.reason}
              </p>
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
