"use client";

import { Dialog } from "@headlessui/react";
import ProfileImage from "@/components/ProfileImage";
// ✅ Inline Employee type since you're not using a shared types folder
interface Employee {
  id: string;
  fullName: string;
  email: string;
  employeeId: string;
  department: string;
  role: string;
  status: string;
  photoURL?: string;
  phone?: string;
  address?: string;
  bio?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export default function EmployeeProfileModal({ isOpen, onClose, employee }: Props) {
  if (!employee) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 space-y-4">
          <Dialog.Title className="text-2xl font-semibold text-blue-600">👤 Employee Profile</Dialog.Title>

          <div className="flex flex-col items-center text-center">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-200">
            <ProfileImage
                src={employee.photoURL}
                alt="Profile"
                size={112}
                className="w-full h-full"
            />
            </div>
            <h2 className="mt-3 text-xl font-bold">{employee.fullName}</h2>
            <p className="text-gray-500">{employee.email}</p>
            <p className="text-sm text-gray-400">{employee.employeeId}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <strong>Department:</strong>
              <p>{employee.department}</p>
            </div>
            <div>
              <strong>Role:</strong>
              <p>{employee.role}</p>
            </div>
            <div>
              <strong>Status:</strong>
              <p>{employee.status}</p>
            </div>
            <div>
              <strong>Phone:</strong>
              <p>{employee.phone || "—"}</p>
            </div>
            <div className="sm:col-span-2">
              <strong>Address:</strong>
              <p>{employee.address || "—"}</p>
            </div>
            <div className="sm:col-span-2">
              <strong>Bio:</strong>
              <p className="text-sm text-gray-600 dark:text-gray-300">{employee.bio || "—"}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
