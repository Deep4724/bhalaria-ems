"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, ArrowLeft } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  employeeId: string;
  joinDate: string;
}

export default function EmployeeDirectoryPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchEmployees = async () => {
      const querySnapshot = await getDocs(collection(db, "employees"));
      const employeeData: Employee[] = querySnapshot.docs.map((doc) => ({
        ...(doc.data() as Employee),
        id: doc.id, // ✅ ensure unique key
      }));
      setEmployees(employeeData);
    };
    fetchEmployees();
  }, []);

  return (
    // ✅ Add dark mode base styles
    <div className="p-6 bg-white dark:bg-[#0f172a] min-h-screen text-gray-900 dark:text-gray-100">
      <button
        onClick={() => router.push("/hr/dashboard")}
        className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="flex items-center gap-2 mb-6">
        <Users className="text-blue-600 dark:text-blue-400 w-6 h-6" />
        <h1 className="text-2xl font-bold text-blue-800 dark:text-blue-300">
          Employee Directory
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {employees.map((emp, index) => (
          <div
            key={emp.id || index}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition"
          >
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
              {emp.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Employee ID: <span className="font-medium">{emp.employeeId}</span>
            </p>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <p>
                <span className="font-medium">Email:</span> {emp.email}
              </p>
              <p>
                <span className="font-medium">Phone:</span> {emp.phone}
              </p>
              <p>
                <span className="font-medium">Department:</span>{" "}
                {emp.department}
              </p>
              <p>
                <span className="font-medium">Designation:</span>{" "}
                {emp.designation}
              </p>
              <p>
                <span className="font-medium">Join Date:</span> {emp.joinDate}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
