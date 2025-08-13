"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { sendPasswordResetEmail } from "firebase/auth";

// ✅ Strictly typed employee
interface Employee {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  role: string;
  department?: string;
}

// ✅ Constant options
const roles = ["Super Admin", "Admin", "HR", "Employee"];
const departments = [
  "Production",
  "Maintenance",
  "Admin",
  "HR",
  "Dispatch",
  "Accounts",
  "Sales",
  "Marketing",
  "Quality Control",
];

export default function AdminSecuritySettingsPage() {
  const [users, setUsers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null
  );
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);

  const currentUid = auth.currentUser?.uid ?? "";

  // ✅ Fetch employees on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "employees"));
        const data = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<Employee, "id">),
          id: d.id,
        }));
        setUsers(data);
      } catch (err) {
        toast.error("❌ Failed to load users");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // ✅ Sorting
  const sortedUsers = [...users].sort((a, b) =>
    sortAsc
      ? a.fullName.localeCompare(b.fullName)
      : b.fullName.localeCompare(a.fullName)
  );

  const getDeptBadgeColor = (dept: string) => {
    switch (dept) {
      case "Production":
        return "bg-red-100 text-red-800";
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "Admin":
        return "bg-blue-100 text-blue-800";
      case "HR":
        return "bg-pink-100 text-pink-800";
      case "Dispatch":
        return "bg-green-100 text-green-800";
      case "Accounts":
        return "bg-purple-100 text-purple-800";
      case "Sales":
        return "bg-orange-100 text-orange-800";
      case "Marketing":
        return "bg-teal-100 text-teal-800";
      case "Quality Control":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const handleRoleChange = (id: string, role: string) => {
    setSelectedUserId(id);
    setSelectedRole(role);
    setShowRoleModal(true);
  };

  const handleDeptChange = (id: string, dept: string) => {
    setSelectedUserId(id);
    setSelectedDepartment(dept);
    setShowDeptModal(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUserId || !selectedRole) return;
    try {
      await updateDoc(doc(db, "employees", selectedUserId), {
        role: selectedRole,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUserId ? { ...u, role: selectedRole } : u
        )
      );
      toast.success("✅ Role updated");
    } catch (err) {
      toast.error("❌ Failed to update role");
      console.error(err);
    } finally {
      setShowRoleModal(false);
    }
  };

  const confirmDeptChange = async () => {
    if (!selectedUserId || !selectedDepartment) return;
    try {
      await updateDoc(doc(db, "employees", selectedUserId), {
        department: selectedDepartment,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUserId ? { ...u, department: selectedDepartment } : u
        )
      );
      toast.success("✅ Department updated");
    } catch (err) {
      toast.error("❌ Failed to update department");
      console.error(err);
    } finally {
      setShowDeptModal(false);
    }
  };

  const sendResetEmail = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/reset-password`, // optional: custom redirect
      });
      toast.success(`✅ Reset link sent to ${email}`);
    } catch (err) {
      toast.error("❌ Email send failed");
      console.error(err);
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700 dark:text-white">
        🔐 Admin Security Settings
      </h1>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="text-sm px-4 py-2 bg-blue-100 dark:bg-gray-700 text-blue-800 dark:text-white rounded"
        >
          Sort ({sortAsc ? "A-Z" : "Z-A"})
        </button>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow ring-1 ring-gray-200 dark:ring-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-left font-semibold">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Change Role</th>
              <th className="p-4">Department</th>
              <th className="p-4">Change Dept.</th>
              <th className="p-4">Reset Link</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-6">
                  Loading...
                </td>
              </tr>
            ) : (
              sortedUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-t hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="p-4 font-medium">{u.fullName}</td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">{u.role}</td>
                  <td className="p-4">
                    <select
                      defaultValue=""
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={
                        u.role === "Super Admin" || u.uid === currentUid
                      }
                      className="w-full p-2 border rounded dark:bg-gray-700"
                    >
                      <option value="" disabled>
                        Select Role
                      </option>
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getDeptBadgeColor(
                        u.department || ""
                      )}`}
                    >
                      {u.department || "—"}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={u.department || ""}
                      onChange={(e) => handleDeptChange(u.id, e.target.value)}
                      className="w-full p-2 border rounded dark:bg-gray-700"
                    >
                      <option value="">Select</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => sendResetEmail(u.email)} // ✅ Remove u.fullName
                      className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1 rounded"
                    >
                      Send Link
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Confirm Modals */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="font-bold mb-4 text-lg dark:text-white">
              Confirm Role Change
            </h2>
            <p className="text-sm mb-4 dark:text-gray-300">
              Change user role to <strong>{selectedRole}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmRoleChange}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeptModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="font-bold mb-4 text-lg dark:text-white">
              Confirm Department Change
            </h2>
            <p className="text-sm mb-4 dark:text-gray-300">
              Change department to <strong>{selectedDepartment}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeptModal(false)}
                className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeptChange}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
