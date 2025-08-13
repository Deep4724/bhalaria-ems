"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// Strict Paystub interface (matches Firestore data)
interface PayStub {
  name: string;
  empId: string;
  department: string;
  baseRate: number;
  bonus: number;
  overtime: number;
  deductions: number;
  hoursWorked: number;
  email: string;
  netPay: number;
  payPeriod: { start?: string; end: string };
  month: string; // Always set in client
}

export default function PayStubPage() {
  const [payStubs, setPayStubs] = useState<PayStub[]>([]);
  const [currentStub, setCurrentStub] = useState<PayStub | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const pdfRef = useRef<HTMLDivElement>(null);

  // Fetch paystubs for logged-in employee
  useEffect(() => {
    setLoading(true);
    setError("");

    // ✅ Add the auth listener ONCE and store unsubscribe function as const
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }

      try {
        // Get employeeId for this user
        const empQuery = query(
          collection(db, "employees"),
          where("uid", "==", user.uid)
        );
        const empSnapshot = await getDocs(empQuery);
        if (empSnapshot.empty) throw new Error("Employee profile not found.");
        const employeeData = empSnapshot.docs[0].data();
        const empId = employeeData.employeeId;
        if (!empId) throw new Error("Employee ID is missing.");

        // Fetch paystubs for this employee
        const stubQuery = query(
          collection(db, "paystubs"),
          where("empId", "==", empId)
        );
        const stubSnapshot = await getDocs(stubQuery);

        // Map to typed objects, ensure month is present
        const paystubData: PayStub[] = stubSnapshot.docs.map((doc) => {
          const data = doc.data() as Omit<PayStub, "month"> &
            Partial<Pick<PayStub, "month">>;
          const endDate = data.payPeriod?.end;
          // Calculate month string from end date (fallback to Unknown)
          const month =
            (endDate &&
              new Date(endDate).toLocaleString("default", {
                month: "long",
                year: "numeric",
              })) ||
            "Unknown";
          return { ...data, month };
        });

        // Sort paystubs by end date descending
        paystubData.sort((a, b) => {
          const aDate = a.payPeriod?.end
            ? new Date(a.payPeriod.end)
            : new Date(0);
          const bDate = b.payPeriod?.end
            ? new Date(b.payPeriod.end)
            : new Date(0);
          return bDate.getTime() - aDate.getTime();
        });

        setPayStubs(paystubData);

        if (paystubData.length > 0) {
          setSelectedMonth(paystubData[0].month);
          setCurrentStub(paystubData[0]);
        } else {
          setSelectedMonth("");
          setCurrentStub(null);
        }
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError("Failed to load paystubs.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  // When month changes, update stub
  useEffect(() => {
    const found = payStubs.find((p) => p.month === selectedMonth);
    setCurrentStub(found || null);
  }, [selectedMonth, payStubs]);

  // Download PDF handler
  const downloadPDF = async () => {
    const element = pdfRef.current;
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(`PayStub-${selectedMonth}.pdf`);
    } catch (err) {
      setError("Failed to generate PDF.");
      console.error("PDF error:", err);
    }
  };

  // Earnings calculations
  const basePay = currentStub
    ? currentStub.baseRate * currentStub.hoursWorked
    : 0;
  const totalEarnings = currentStub
    ? basePay + currentStub.bonus + currentStub.overtime
    : 0;
  const totalDeductions = currentStub?.deductions || 0;
  const netPay = totalEarnings - totalDeductions;

  // Chart data for all stubs
  const chartData = payStubs.map((stub) => ({
    label: stub.month || "Unknown",
    net:
      stub.baseRate * stub.hoursWorked +
      stub.bonus +
      stub.overtime -
      stub.deductions,
  }));

  // Unique months for dropdown (sorted descending by date)
  const uniqueMonths = Array.from(
    new Set(
      payStubs
        .map((p) => ({
          month: p.month,
          date: p.payPeriod?.end ? new Date(p.payPeriod.end) : new Date(0),
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map((item) => item.month)
    )
  );

  // Render
  if (loading)
    return (
      <div className="p-6 text-blue-600 dark:text-blue-400">Loading...</div>
    );
  if (error)
    return (
      <div className="p-6 text-red-600 dark:text-red-400">Error: {error}</div>
    );
  if (!currentStub)
    return (
      <div className="p-6 text-gray-600 dark:text-gray-300">
        No paystub records found.
      </div>
    );

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          Pay Stub - {selectedMonth}
        </h1>
        <div className="flex gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border dark:border-gray-700 dark:bg-gray-800 px-3 py-1 rounded-md"
          >
            {uniqueMonths.map((month, idx) => (
              <option key={`${month}-${idx}`} value={month}>
                {month}
              </option>
            ))}
          </select>

          <button
            onClick={downloadPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow transition"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-md mb-6">
        <h2 className="text-center font-semibold text-green-700 dark:text-green-400 mb-2">
          📈 Net Pay Overview
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#10b981"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Paystub PDF Section */}
      <div
        ref={pdfRef}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow max-w-3xl mx-auto text-sm text-gray-800 dark:text-gray-100"
      >
        <div className="text-center font-bold text-lg mb-2">
          Bhalaria Metal Craft Pvt Ltd
        </div>
        <p className="text-center text-xs mb-4">
          Raj Asman, Bhayandar West, Maharashtra 401101
        </p>
        <div className="flex justify-between mb-4 flex-wrap gap-2">
          <div>
            <p>
              <strong>Name:</strong> {currentStub.name}
            </p>
            <p>
              <strong>Employee ID:</strong> {currentStub.empId}
            </p>
            <p>
              <strong>Email:</strong> {currentStub.email}
            </p>
          </div>
          <div>
            <p>
              <strong>Department:</strong> {currentStub.department}
            </p>
            <p>
              <strong>Period Start:</strong>{" "}
              {currentStub.payPeriod?.start
                ? new Date(currentStub.payPeriod.start).toLocaleDateString()
                : "N/A"}
            </p>
            <p>
              <strong>Period End:</strong>{" "}
              {currentStub.payPeriod?.end
                ? new Date(currentStub.payPeriod.end).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        <table className="w-full border text-xs mb-4">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="border px-2 py-1 text-left">Description</th>
              <th className="border px-2 py-1">Earnings</th>
              <th className="border px-2 py-1">Deductions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-1">Base Pay</td>
              <td className="border px-2 py-1 text-center">
                ₹{currentStub.baseRate} × {currentStub.hoursWorked} = ₹{basePay}
              </td>
              <td className="border px-2 py-1 text-center">-</td>
            </tr>
            <tr>
              <td className="border px-2 py-1">Bonus</td>
              <td className="border px-2 py-1 text-center">
                ₹{currentStub.bonus}
              </td>
              <td className="border px-2 py-1 text-center">-</td>
            </tr>
            <tr>
              <td className="border px-2 py-1">Overtime</td>
              <td className="border px-2 py-1 text-center">
                ₹{currentStub.overtime}
              </td>
              <td className="border px-2 py-1 text-center">-</td>
            </tr>
            <tr>
              <td className="border px-2 py-1">Deductions</td>
              <td className="border px-2 py-1 text-center">-</td>
              <td className="border px-2 py-1 text-center">
                ₹{currentStub.deductions}
              </td>
            </tr>
            <tr className="font-bold bg-gray-50 dark:bg-gray-900">
              <td className="border px-2 py-1">Total</td>
              <td className="border px-2 py-1 text-center">₹{totalEarnings}</td>
              <td className="border px-2 py-1 text-center">
                ₹{totalDeductions}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="flex justify-between font-bold text-base">
          <span>Net Pay:</span>
          <span className="text-green-600 dark:text-green-400 text-lg">
            ₹{netPay}
          </span>
        </div>
      </div>
    </div>
  );
}
