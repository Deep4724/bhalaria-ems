"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import Link from "next/link";
import { HiArrowLeft } from "react-icons/hi2";
import PDFDownloadButton from "@/components/PDFDownloadButton";

// ✅ Employee strict type
type Employee = {
  empId: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: string;
  joinDate: string;
};

// ✅ Paystub history type
type Paystub = {
  createdAt: Timestamp;
  payPeriod: { start: string; end: string };
  baseRate: number;
  hoursWorked: number;
  overtime: number;
  bonus: number;
  deductions: number;
  tax: number;
  netPay: number;
};

export default function PaystubDetailPage() {
  const params = useParams() as { empId?: string };
  const empId = typeof params?.empId === "string" ? params.empId : "";

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [baseRate, setBaseRate] = useState(200);
  const [hoursWorked, setHoursWorked] = useState(0);
  const [overtime, setOvertime] = useState(300);
  const [bonus, setBonus] = useState(1000);
  const [deductions, setDeductions] = useState(500);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [history, setHistory] = useState<Paystub[]>([]); // 🕓 history

  const gross = baseRate * hoursWorked + overtime + bonus;
  const tax = gross > 62500 ? gross * 0.05 : 0;
  const netPay = gross - tax - deductions;

  // ⏳ Calculate hours worked from dates
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays =
        Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
      setHoursWorked(diffDays > 0 ? diffDays * 8 : 0);
    }
  }, [startDate, endDate]);

  // 🔁 Fetch employee
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!empId) return;
      try {
        const q = query(
          collection(db, "employees"),
          where("employeeId", "==", empId)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const doc = snapshot.docs[0].data();
          const emp: Employee = {
            empId: doc.employeeId,
            name: doc.name || doc.fullName || "N/A",
            email: doc.email,
            department: doc.department,
            position: doc.position,
            status: doc.status,
            joinDate: doc.joinDate?.toDate?.()
              ? doc.joinDate.toDate().toDateString()
              : doc.joinDate || "N/A",
          };
          setEmployee(emp);
        }
      } catch (error) {
        console.error("Fetch employee failed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [empId]);

  // 📄 Fetch paystub history
  useEffect(() => {
    const fetchPaystubs = async () => {
      if (!empId) return;
      try {
        const q = query(
          collection(db, "paystubs"),
          where("empId", "==", empId),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const paystubs: Paystub[] = snapshot.docs.map(
          (doc) => doc.data() as Paystub
        );
        setHistory(paystubs);
      } catch (err) {
        console.error("Failed to load paystub history", err);
      }
    };
    fetchPaystubs();
  }, [empId]);

  // 💾 Save paystub
  const handleSave = async () => {
    if (!startDate || !endDate) {
      setMessage("❌ Please select both start and end date.");
      return;
    }

    try {
      await addDoc(collection(db, "paystubs"), {
        empId,
        name: employee?.name,
        email: employee?.email,
        position: employee?.position,
        department: employee?.department,
        payPeriod: { start: startDate, end: endDate },
        baseRate,
        hoursWorked,
        overtime,
        bonus,
        deductions,
        tax,
        netPay,
        createdAt: Timestamp.now(),
      });
      setMessage("✅ Paystub saved.");
    } catch (err) {
      console.error("Error saving paystub:", err);
      setMessage("❌ Failed to save.");
    }
  };

  if (loading) return <p className="p-6 text-blue-600">Loading...</p>;
  if (!employee) return <p className="p-6 text-red-600">No employee found.</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 space-y-6">
        <Link
          href="/hr/payroll"
          className="inline-block text-blue-600 hover:text-blue-800 font-semibold mb-2"
        >
          <HiArrowLeft className="inline mr-1" /> Back to Payroll
        </Link>

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            📄 Paystub - {employee.name}
          </h1>
          <PDFDownloadButton
            employee={employee}
            payDetails={{
              baseRate,
              hoursWorked,
              overtime,
              bonus,
              deductions,
              tax,
              netPay,
              payPeriodStart: startDate,
              payPeriodEnd: endDate,
            }}
          />
        </div>

        {/* EMPLOYEE INFO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium">Employee ID</p>
            <p>{employee.empId}</p>
          </div>
          <div>
            <p className="font-medium">Department</p>
            <p>{employee.department}</p>
          </div>
          <div>
            <p className="font-medium">Position</p>
            <p>{employee.position}</p>
          </div>
          <div>
            <p className="font-medium">Status</p>
            <p>{employee.status}</p>
          </div>
          <div>
            <p className="font-medium">Email</p>
            <p>{employee.email}</p>
          </div>
          <div>
            <p className="font-medium">Joined</p>
            <p>{employee.joinDate}</p>
          </div>
        </div>

        <hr className="my-4" />

        {/* PAYROLL FORM */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            📊 Payroll Calculation
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Pay Period Start</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded bg-white text-gray-800"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Pay Period End</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded bg-white text-gray-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label>Base Rate (₹/hr)</label>
              <input
                type="number"
                value={baseRate}
                onChange={(e) => setBaseRate(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label>Hours Worked</label>
              <input
                type="number"
                value={hoursWorked}
                disabled
                className="w-full px-3 py-2 border rounded bg-gray-100"
              />
            </div>
            <div>
              <label>Overtime (₹)</label>
              <input
                type="number"
                value={overtime}
                onChange={(e) => setOvertime(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label>Bonus (₹)</label>
              <input
                type="number"
                value={bonus}
                onChange={(e) => setBonus(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label>Deductions (₹)</label>
              <input
                type="number"
                value={deductions}
                onChange={(e) => setDeductions(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>

          <div className="mt-2 text-sm text-gray-600">
            Tax Deducted: ₹{tax.toFixed(0)}
          </div>

          <div className="mt-4 bg-gray-100 p-4 rounded text-center">
            <h3 className="text-lg font-semibold text-gray-800">💰 Net Pay</h3>
            <p className="text-2xl text-green-700 font-bold">
              ₹{netPay.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded shadow-sm"
            >
              Save Paystub
            </button>
          </div>

          {message && (
            <p className="text-sm text-blue-600 text-center mt-2">{message}</p>
          )}
        </div>

        {/* 📜 PAYSTUB HISTORY */}
        {history.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              📋 Paystub History
            </h2>
            <div className="space-y-4">
              {history.map((stub, idx) => (
                <div
                  key={idx}
                  className="p-4 border rounded bg-gray-50 shadow-sm text-sm"
                >
                  <p>
                    <strong>Pay Period:</strong> {stub.payPeriod.start} ➜{" "}
                    {stub.payPeriod.end}
                  </p>
                  <p>
                    <strong>Net Pay:</strong> ₹
                    {stub.netPay.toLocaleString("en-IN")}
                  </p>
                  <p>
                    <strong>Hours Worked:</strong> {stub.hoursWorked}
                  </p>
                  <p>
                    <strong>Generated On:</strong>{" "}
                    {stub.createdAt.toDate().toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
