"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  collection,
  deleteDoc,
  doc,
  query,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast, { Toaster } from "react-hot-toast";
import { Briefcase, Eye, Pencil, Trash2, Activity } from "lucide-react";
import CSVExportButton from "@/components/CSVExportButton";
import ProfileImage from "@/components/ProfileImage";
import EmployeeProfileModal from "@/components/EmployeeProfileModal";
import EditEmployeeModal from "@/components/admin/EditEmployeeModal";
import ClientOnlySelect from "@/components/shared/ClientOnlySelect";
import ConfirmDeleteModal from "@/components/shared/ConfirmDeleteModal";

interface Employee {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  employeeId: string;
  department: string;
  role: string;
  status: string;
  position?: string;
  joinDate?: string;
  photoURL?: string;
}

type OptionType = { label: string; value: string };

export default function EmployeeDirectoryPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string[]>([]);
  const [status, setStatus] = useState("All");
  const [viewing, setViewing] = useState<Employee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [mounted, setMounted] = useState(false);
  const [menuPortalTarget, setMenuPortalTarget] = useState<HTMLElement | null>(
    null
  );

  useEffect(() => {
    const q = query(collection(db, "employees"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Employee[];
      setEmployees(list);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setMounted(true);
    setMenuPortalTarget(document.body);
  }, []);

  const departments = useMemo(
    () =>
      Array.from(new Set(employees.map((e) => e.department)))
        .filter(Boolean)
        .sort(),
    [employees]
  );

  const statuses = useMemo(
    () =>
      Array.from(new Set(employees.map((e) => e.status)))
        .filter(Boolean)
        .sort(),
    [employees]
  );

  const filterAndSearch = useCallback(() => {
    let result = [...employees];
    const s = search.toLowerCase();
    if (search.trim()) {
      result = result.filter(
        (e) =>
          e.fullName.toLowerCase().includes(s) ||
          e.email.toLowerCase().includes(s) ||
          e.employeeId.toLowerCase().includes(s)
      );
    }
    if (department.length > 0)
      result = result.filter((e) => department.includes(e.department));
    if (status !== "All") result = result.filter((e) => e.status === status);
    setFiltered(result);
  }, [employees, search, department, status]);

  useEffect(() => {
    filterAndSearch();
  }, [filterAndSearch]);

  const handleDelete = async (id: string) => {
    if (!id) return;
    await deleteDoc(doc(db, "employees", id));
    toast.success("Employee deleted");
    setDeleting(null);
  };

  // Map of department badge colors
  const departmentColors: Record<string, string> = {
    Admin: "bg-blue-100 text-blue-700",
    HR: "bg-purple-100 text-purple-700",
    Dispatch: "bg-yellow-100 text-yellow-700",
    Production: "bg-red-100 text-red-700",
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">
          Employee Directory
        </h1>
        {/* <Link href="/admin/employees/add">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            + Add Employee
          </button>
        </Link> */}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Search by name, email or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-900 text-sm"
          />

          {mounted && (
            <ClientOnlySelect<OptionType>
              isMulti
              options={departments.map((d) => ({ label: d, value: d }))}
              placeholder="Departments"
              onChange={(selected) => {
                if (Array.isArray(selected)) {
                  setDepartment(selected.map((s) => s.value));
                } else {
                  setDepartment([]);
                }
              }}
              className="min-w-[200px] text-sm"
              menuPortalTarget={menuPortalTarget}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          )}

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border px-3 py-2 rounded-md dark:bg-gray-900 text-sm"
          >
            <option value="All">All Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearch("");
              setDepartment([]);
              setStatus("All");
            }}
            className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors text-sm font-semibold shadow"
          >
            Clear Filters
          </button>
        </div>

        <CSVExportButton data={filtered} filename="employees.csv" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-semibold">No matching employees</p>
          <p className="text-sm">Try adjusting filters or search terms.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Employee</th>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Department
                </th>
                <th className="px-4 py-3 text-left font-semibold">Position</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Join Date</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, index) => (
                <tr
                  key={emp.id}
                  className={`${
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-50 dark:bg-gray-700"
                  } hover:bg-gray-100 dark:hover:bg-gray-600 border-t border-gray-200 dark:border-gray-700`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <ProfileImage
                        src={emp.photoURL}
                        alt={emp.fullName}
                        size={40}
                        className="rounded-full shadow-sm"
                      />
                      <div>
                        <div className="font-medium text-sm">
                          {emp.fullName}
                        </div>
                        <div className="text-xs text-gray-500">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{emp.employeeId}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        departmentColors[emp.department] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <Briefcase className="w-3 h-3" />
                      {emp.department}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{emp.position ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                        emp.status === "On Leave"
                          ? "bg-yellow-100 text-yellow-700"
                          : "text-green-700 bg-green-100"
                      }`}
                    >
                      <Activity className="w-3 h-3" />
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{emp.joinDate ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => setViewing(emp)}
                        title="View"
                        className="w-8 h-8 flex justify-center items-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditing(emp)}
                        title="Edit"
                        className="w-8 h-8 flex justify-center items-center rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleting(emp)}
                        title="Delete"
                        className="w-8 h-8 flex justify-center items-center rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EmployeeProfileModal
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
        employee={viewing}
      />
      <EditEmployeeModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        employee={editing}
        refresh={() => {}}
      />
      <ConfirmDeleteModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Employee"
        description={`Are you sure you want to delete ${deleting?.fullName}?`}
        onConfirm={() => deleting && handleDelete(deleting.id)}
      />
    </div>
  );
}
