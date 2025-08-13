"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import toast, { Toaster } from "react-hot-toast";
import CSVExportButton from "@/components/CSVExportButton";
import { FaUsers } from "react-icons/fa";

interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: string;
  status: string;
  employeeId: string;
}

const departments = [
  "Production",
  "Maintenance",
  "Admin",
  "HR",
  "Dispatch",
  "Quality Control",
  "Packaging",
];

const roles = ["Employee", "Admin", "Super-Admin"];

const badgeColors: Record<string, string> = {
  Production: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Maintenance:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Admin:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  HR: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Dispatch: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  "Quality Control":
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Packaging: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  Employee: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  AdminRole:
    "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  "Super-Admin": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function CreateEmployeePage() {
  // List of all employees, fetched from Firestore
  const [employees, setEmployees] = useState<Employee[]>([]);
  // Loading state for UI feedback
  const [loading, setLoading] = useState(false);

  // Form state for new employee input fields
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    role: "Employee",
  });

  // Fetch all employees from Firestore and update state
  const fetchEmployees = async () => {
    const snapshot = await getDocs(collection(db, "employees"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Employee[];
    setEmployees(data);
  };

  // Fetch employees on first render
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Validate input fields before submitting the form
  const validateForm = () => {
    const { fullName, email, phone, department, position } = form;
    const nameRegex = /^[A-Za-z\s]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;

    // Check that all required fields are filled in
    if (!fullName || !email || !phone || !department || !position) {
      toast.error("All fields are required.");
      return false;
    }
    // Name should only contain letters and spaces
    if (!nameRegex.test(fullName)) {
      toast.error("Name should not contain numbers or special characters.");
      return false;
    }
    // Validate email format
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    // Phone should be between 10 and 15 digits
    if (!phoneRegex.test(phone)) {
      toast.error("Phone number should be 10–15 digits.");
      return false;
    }
    return true;
  };

  // Handle creating a new employee
  const handleSubmit = async (): Promise<void> => {
    // Prevent submit if form is invalid
    if (!validateForm()) return;

    const { fullName, email, phone, department, position, role } = form;
    setLoading(true);

    try {
      // Find the last employeeId to increment for the new employee
      const lastSnap = await getDocs(
        query(
          collection(db, "employees"),
          orderBy("employeeId", "desc"),
          limit(1)
        )
      );
      const lastId = lastSnap.empty
        ? "EMP000"
        : lastSnap.docs[0].data().employeeId;
      const nextId = parseInt(lastId.replace("EMP", ""), 10) + 1;
      const employeeId = `EMP${nextId.toString().padStart(3, "0")}`;

      // Create user in Firebase Auth with a default password
      const defaultPassword = "welcome123";
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        defaultPassword
      );

      // Send a password reset email so the user can set their own password
      await sendPasswordResetEmail(auth, email);

      // Add the employee details to Firestore
      await addDoc(collection(db, "employees"), {
        fullName,
        email,
        phone,
        department,
        position,
        role,
        employeeId,
        uid: userCred.user.uid,
        status: "Active",
        createdAt: Timestamp.now(),
      });

      toast.success("Employee created & invite sent!");

      // Reset the form fields after successful creation
      setForm({
        fullName: "",
        email: "",
        phone: "",
        department: "",
        position: "",
        role: "Employee",
      });

      // Refresh the employee list to show the new employee
      fetchEmployees();
    } catch (err) {
      // Show error if something goes wrong
      const msg =
        err instanceof Error ? err.message : "Unexpected error occurred";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 text-gray-900 dark:text-gray-100">
      <Toaster position="top-center" />

      <h1 className="text-2xl sm:text-3xl font-bold text-center text-blue-700 dark:text-blue-400 mb-6 sm:mb-8">
        👥 Create New Employee
      </h1>

      <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl shadow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="* Full Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="border rounded-lg p-3 shadow-sm w-full bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
        <input
          type="email"
          placeholder="* Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border rounded-lg p-3 shadow-sm w-full bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
        <input
          type="tel"
          placeholder="* Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="border rounded-lg p-3 shadow-sm w-full bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
        <select
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          className="border rounded-lg p-3 shadow-sm w-full bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        >
          <option value="">* Department</option>
          {departments.map((dept) => (
            <option key={dept}>{dept}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="* Position"
          value={form.position}
          onChange={(e) => setForm({ ...form, position: e.target.value })}
          className="border rounded-lg p-3 shadow-sm w-full bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="border rounded-lg p-3 shadow-sm w-full bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        >
          {roles.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="col-span-1 sm:col-span-2 lg:col-span-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg mt-2 shadow-md w-full dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {loading ? "Creating..." : "➕ Create Employee"}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-10">
        <h2 className="text-xl font-semibold flex gap-2 items-center text-indigo-700 dark:text-indigo-300">
          <FaUsers /> Employee Directory
        </h2>
        <CSVExportButton data={employees} filename="employees.csv" />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm text-left bg-white dark:bg-gray-900">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Emp ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Dept</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {employees.map((emp) => (
              <tr
                key={emp.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="px-4 py-3 font-mono">{emp.employeeId}</td>
                <td className="px-4 py-3">{emp.fullName}</td>
                <td className="px-4 py-3 text-blue-600 dark:text-blue-400">
                  {emp.email}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      badgeColors[emp.department] || ""
                    }`}
                  >
                    {emp.department}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      badgeColors[emp.role] || ""
                    }`}
                  >
                    {emp.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-green-700 dark:text-green-400 font-semibold">
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
