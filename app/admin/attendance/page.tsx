"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { parse, differenceInMinutes } from "date-fns";
import { FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import TimePicker from "@/components/shared/TimePicker";
import CSVExportButton from "@/components/CSVExportButton";
import { calculateDuration } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  employeeId: string;
  department: string;
  date: string;
  clockIn: string;
  clockOut: string;
  status: string;
}
interface Employee {
  uid: string;
  fullName: string;
  email: string;
  employeeId: string;
  department: string;
}

const departmentOptions = [
  "All",
  "Admin",
  "HR",
  "Production",
  "Maintenance",
  "Dispatch",
];
const statusOptions = ["All", "Present", "Absent", "Left Early", "Half Day"];

// --- Modal for Confirm Delete ---
function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-lg font-bold mb-3">{title}</h2>
        <div className="text-gray-700 dark:text-gray-300 mb-6">{message}</div>
        <div className="flex gap-2 justify-end">
          <button
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function AdminAttendancePage() {
  // --- State ---
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null
  );
  const [selectedEmployeeUid, setSelectedEmployeeUid] = useState<string | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [date, setDate] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // --- Fetch employees
  useEffect(() => {
    getDocs(collection(db, "employees")).then((snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data() as Employee);
      setEmployees(data.sort((a, b) => a.fullName.localeCompare(b.fullName)));
    });
  }, []);

  // --- Fetch attendance records live
  useEffect(() => {
    const q = query(collection(db, "attendance-records"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: AttendanceRecord[] = snapshot.docs.map((doc) => ({
        ...(doc.data() as Omit<AttendanceRecord, "id">),
        id: doc.id,
      }));
      setRecords(data.sort((a, b) => b.date.localeCompare(a.date)));
    });
    return () => unsub();
  }, []);

  // --- Filtered records
  const filteredRecords = records.filter((rec) => {
    const matchDept = selectedDept === "All" || rec.department === selectedDept;
    const matchStatus = statusFilter === "All" || rec.status === statusFilter;
    const matchDate =
      (!fromDate || rec.date >= fromDate) && (!toDate || rec.date <= toDate);
    const matchSearch =
      rec.fullName.toLowerCase().includes(search.toLowerCase()) ||
      rec.email.toLowerCase().includes(search.toLowerCase()) ||
      rec.employeeId.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchStatus && matchDate && matchSearch;
  });

  // --- Reset form fields
  const resetForm = () => {
    setClockIn("");
    setClockOut("");
    setDate("");
    setSelectedEmployeeUid(null);
    setSelectedRecord(null);
  };

  // --- Mark Attendance (modal save)
  const handleSave = async () => {
    const selectedEmployee = employees.find(
      (e) => e.uid === selectedEmployeeUid
    );
    if (!selectedEmployee || !date || !clockIn || !clockOut) {
      toast.error("All fields are required.");
      return;
    }
    // Compute status
    const start = parse(clockIn, "hh:mm:ss a", new Date());
    const end = parse(clockOut, "hh:mm:ss a", new Date());
    const diff = differenceInMinutes(end, start);
    let status: AttendanceRecord["status"] = "Absent";
    if (isNaN(diff) || diff <= 0) status = "Absent";
    else if (diff < 490) status = "Left Early";
    else status = "Present";
    // Save record
    await addDoc(collection(db, "attendance-records"), {
      uid: selectedEmployee.uid,
      fullName: selectedEmployee.fullName,
      email: selectedEmployee.email,
      employeeId: selectedEmployee.employeeId,
      department: selectedEmployee.department,
      date,
      clockIn,
      clockOut,
      status,
    });
    toast.success("Attendance marked!");
    resetForm();
    setShowModal(false);
  };

  // --- Edit Attendance (modal save)
  const [editStatus, setEditStatus] = useState<string>("Present");
  useEffect(() => {
    if (selectedRecord) setEditStatus(selectedRecord.status);
  }, [selectedRecord]);
  const handleEdit = async () => {
    if (!selectedRecord || !clockIn || !clockOut) {
      toast.error("All fields are required.");
      return;
    }
    try {
      await updateDoc(doc(db, "attendance-records", selectedRecord.id), {
        clockIn,
        clockOut,
        status: editStatus,
      });
      toast.success("Attendance updated.");
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      toast.error("Failed to update.");
      console.error(err);
    }
  };

  // --- Delete Attendance (confirm modal)
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };
  const confirmDelete = async () => {
    if (deleteId) {
      await deleteDoc(doc(db, "attendance-records", deleteId));
      toast.success("Deleted successfully.");
      setDeleteId(null);
      setShowDeleteModal(false);
    }
  };

  // --- Group records by date for display
  const grouped = filteredRecords.reduce((acc, rec) => {
    (acc[rec.date] = acc[rec.date] || []).push(rec);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  // --- Main Render ---
  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-100 dark:bg-gray-900 min-h-screen font-inter text-gray-800 dark:text-gray-200">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        Attendance Tracker
      </h1>

      {/* Filter & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-lg shadow bg-white dark:bg-gray-800">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by Name / Email / ID..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value.replace(/[<>/{}[\]()*]/g, ""))
            }
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-none text-base dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={() => {
              setSearch("");
              setSelectedDept("All");
              setStatusFilter("All");
              setFromDate("");
              setToDate("");
              toast.success("Filters cleared");
            }}
            className="px-4 py-3 text-sm rounded-none font-semibold border border-blue-600 text-blue-700 bg-white hover:bg-blue-50 dark:bg-gray-900 dark:text-blue-400 dark:border-blue-500 dark:hover:bg-gray-800 transition-colors"
          >
            Clear Filters
          </button>
          <CSVExportButton
            data={filteredRecords}
            filename="attendance-records.csv"
          />
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-3 text-sm rounded-none font-semibold bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
          >
            + Mark Attendance
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-xl font-bold mb-4">Additional Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Department */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm w-full dark:bg-gray-900 dark:text-white"
            >
              {departmentOptions.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          {/* Status */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm w-full dark:bg-gray-900 dark:text-white"
            >
              {statusOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          {/* From Date */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm w-full dark:bg-gray-900 dark:text-white"
              max={toDate || undefined}
            />
          </div>
          {/* To Date */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                if (fromDate && e.target.value < fromDate) {
                  toast.error("To Date cannot be earlier than From Date");
                  return;
                }
                setToDate(e.target.value);
              }}
              className="px-3 py-2 border rounded-md text-sm w-full dark:bg-gray-900 dark:text-white"
              min={fromDate || undefined}
            />
          </div>
        </div>
      </div>

      {/* Grouped Attendance Table (by date) */}
      <div className="space-y-6 mt-6">
        {Object.entries(grouped).map(([date, dayRecords]) => (
          <div key={date} className="border rounded-md shadow-sm">
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-white sticky top-0 z-10">
              {date}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 text-sm">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left font-medium">ID</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Clock In
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Clock Out
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {dayRecords.map((rec) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-100">
                        {rec.fullName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {rec.employeeId}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-white">
                          {rec.department}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                        {rec.clockIn}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                        {rec.clockOut}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            rec.status === "Present"
                              ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-white"
                              : rec.status === "Left Early"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-white"
                              : rec.status === "Half Day"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-white"
                              : "bg-red-100 text-red-800 dark:bg-red-700 dark:text-white"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRecord(rec);
                            setClockIn(rec.clockIn);
                            setClockOut(rec.clockOut);
                            setEditStatus(rec.status);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(rec.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* --- Mark Attendance Modal --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-xl shadow-lg space-y-5 overflow-y-auto max-h-[90vh] animate-fadeIn">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Mark Attendance
            </h2>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-white dark:bg-gray-800 text-sm border dark:border-gray-700"
            >
              <option value="">Select department</option>
              {departmentOptions
                .filter((d) => d !== "All")
                .map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
            </select>
            {selectedDept && selectedDept !== "All" && (
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Employees in {selectedDept}
                </label>
                <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-2">
                  {employees
                    .filter((e) => e.department === selectedDept)
                    .map((emp) => (
                      <label
                        key={emp.uid}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <input
                          type="radio"
                          checked={selectedEmployeeUid === emp.uid}
                          onChange={() => setSelectedEmployeeUid(emp.uid)}
                        />
                        {emp.fullName} ({emp.employeeId})
                      </label>
                    ))}
                </div>
              </div>
            )}
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-4">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm bg-white dark:bg-gray-800 border dark:border-gray-700"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Clock In
                </label>
                <TimePicker value={clockIn} onChange={setClockIn} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Clock Out
                </label>
                <TimePicker value={clockOut} onChange={setClockOut} />
              </div>
            </div>
            {clockIn && clockOut && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Working Duration:{" "}
                <span className="font-semibold">
                  {calculateDuration(clockIn, clockOut)}
                </span>
              </p>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Attendance Modal --- */}
      {showEditModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border dark:border-gray-800 animate-fadeIn">
            {/* Accent Top Bar */}
            <div className="h-2 bg-blue-600 dark:bg-blue-500 w-full" />
            <div className="p-8 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1 tracking-tight">
                  Edit Attendance
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedRecord.fullName} ({selectedRecord.employeeId})
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Clock In <span className="text-red-500">*</span>
                  </label>
                  <TimePicker value={clockIn} onChange={setClockIn} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Clock Out <span className="text-red-500">*</span>
                  </label>
                  <TimePicker value={clockOut} onChange={setClockOut} />
                </div>
              </div>
              {/* Status Dropdown */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Left Early">Left Early</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>
              {/* Duration */}
              {clockIn && clockOut && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md px-4 py-2 mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Working Duration:{" "}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {calculateDuration(clockIn, clockOut)}
                  </span>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2 text-sm rounded-md font-semibold border border-blue-600 text-blue-700 bg-white hover:bg-blue-50 dark:bg-gray-900 dark:text-blue-400 dark:border-blue-500 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md font-semibold shadow transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Attendance Record"
        message="Are you sure you want to delete this attendance record? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
