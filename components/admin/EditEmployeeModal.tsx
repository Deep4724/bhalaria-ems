"use client";

import { useEffect, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  refresh: () => void;
}

interface Employee {
  id: string;
  fullName: string;
  email: string;
  employeeId: string;
  department: string;
  role: string;
  status: string;
  position?: string;
  phone?: string;
  address?: string;
  joinDate?: string;
  birthDate?: string;
  photoURL?: string;
}

const departments = [
  "Engineering",
  "Marketing",
  "Human Resources",
  "Finance",
  "Sales",
  "Operations",
  "Dispatch",
  "Production",
];

const roles = ["Employee", "Admin", "HR", "Manager"];
const statuses = ["Active", "On Leave", "Remote"];

export default function EditEmployeeModal({
  isOpen,
  onClose,
  employee,
  refresh,
}: EditEmployeeModalProps) {
  const [form, setForm] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employee) {
      setForm({ ...employee });
      setErrors({});
    }
  }, [employee]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form?.fullName?.trim()) {
      newErrors.fullName = "Name is required";
    } else if (/\d/.test(form.fullName)) {
      newErrors.fullName = "Name cannot contain numbers";
    } else if (form.fullName.length < 3) {
      newErrors.fullName = "Name must be at least 3 characters";
    }

    if (!form?.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (form?.position && /\d/.test(form.position)) {
      newErrors.position = "Position cannot contain numbers";
    }

    if (!form?.department) {
      newErrors.department = "Department is required";
    }

    if (!form?.role) {
      newErrors.role = "Role is required";
    }

    if (!form?.status) {
      newErrors.status = "Status is required";
    }

    if (form?.phone && !/^\d{7,15}$/.test(form.phone)) {
      newErrors.phone = "Phone must be 7-15 digits";
    }

    if (form?.address && form.address.length < 5) {
      newErrors.address = "Address must be at least 5 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSave = async () => {
    if (!form) return;
    if (!validate()) {
      toast.error("Please fix the errors.");
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, "employees", form.id), {
        fullName: form.fullName,
        email: form.email,
        position: form.position ?? "",
        department: form.department,
        role: form.role,
        status: form.status,
        phone: form.phone ?? "",
        address: form.address ?? "",
        joinDate: form.joinDate ?? "",
        birthDate: form.birthDate ?? "",
      });
      toast.success("Employee Data updated");
      onClose();
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !form) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg max-w-xl w-full relative overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500"
        >
          <FaTimes />
        </button>
        <h2 className="text-xl font-semibold mb-4">Edit Employee</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="text-sm">Full Name *</label>
            <input
              name="fullName"
              value={form.fullName ?? ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded mt-1"
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Position */}
          <div>
            <label className="text-sm">Position</label>
            <input
              name="position"
              value={form.position ?? ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded mt-1"
            />
            {errors.position && (
              <p className="text-red-500 text-xs mt-1">{errors.position}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="text-sm">Department *</label>
            <select
              name="department"
              value={form.department ?? ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded mt-1"
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            {errors.department && (
              <p className="text-red-500 text-xs mt-1">{errors.department}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm">Email *</label>
            <input
              name="email"
              type="email"
              value={form.email ?? ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded mt-1"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm">Phone</label>
            <input
              name="phone"
              value={form.phone ?? ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded mt-1"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Join Date */}
          <div>
            <label className="text-sm">Join Date</label>
            <input
              name="joinDate"
              type="date"
              value={form.joinDate ?? ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded mt-1"
            />
          </div>

          {/* Birth Date */}
          <div>
            <label className="text-sm">Birth Date</label>
            <input
              name="birthDate"
              type="date"
              value={form.birthDate ?? ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded mt-1"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm">Status *</label>
            <select
              name="status"
              value={form.status ?? ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded mt-1"
            >
              <option value="">Select status</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {errors.status && (
              <p className="text-red-500 text-xs mt-1">{errors.status}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="text-sm">Role *</label>
            <select
              name="role"
              value={form.role ?? ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded mt-1"
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            {errors.role && (
              <p className="text-red-500 text-xs mt-1">{errors.role}</p>
            )}
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="text-sm">Address</label>
            <textarea
              name="address"
              value={form.address ?? ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded mt-1"
              rows={2}
            />
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
