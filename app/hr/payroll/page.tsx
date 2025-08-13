"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  parseISO,
  format,
  addMonths,
  isBefore,
  isAfter,
  startOfMonth,
  endOfMonth,
} from "date-fns";

type Employee = {
  uid: string;         // Firestore doc id of employee (not used for paystubs)
  employeeId: string;  // e.g. "EMP008"  ← this is what paystubs store
  name: string;
  email: string;
  department: string;
  position: string;
};

type PayStatuses = Record<string, "Paid" | "Pending" | "Checking...">;

function getMonthKeysBetween(startISO: string, endISO: string): string[] {
  const startDate = parseISO(startISO);
  const endDate = parseISO(endISO);
  const keys: string[] = [];

  // safety guard
  if (isAfter(startDate, endDate)) return keys;

  let current = startOfMonth(startDate);
  const last = endOfMonth(endDate);
  // include every month touching the range [start, end]
  while (!isBefore(last, current)) {
    keys.push(format(current, "yyyy-MM"));
    current = addMonths(current, 1);
  }
  return keys;
}

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payStatuses, setPayStatuses] = useState<PayStatuses>({});
  const [payPeriodStart, setPayPeriodStart] = useState("");
  const [payPeriodEnd, setPayPeriodEnd] = useState("");
  const [rangeError, setRangeError] = useState("");

  // precompute month keys for current selectors
  const requiredMonths = useMemo(() => {
    if (!payPeriodStart || !payPeriodEnd) return [];
    return getMonthKeysBetween(payPeriodStart, payPeriodEnd);
  }, [payPeriodStart, payPeriodEnd]);

  // 1) Load Employees
  useEffect(() => {
    const fetchEmployees = async () => {
      const snapshot = await getDocs(collection(db, "employees"));
      const data = snapshot.docs.map((doc) => {
        const emp = doc.data() as Omit<Employee, "uid">;
        return { ...emp, uid: doc.id };
      });
      setEmployees(data);
    };
    fetchEmployees();
  }, []);

  // 2) Compute Pay Statuses whenever employees or date range changes
  useEffect(() => {
    const run = async () => {
      setRangeError("");

      // must have both dates
      if (!payPeriodStart || !payPeriodEnd) return;

      // guard invalid range
      if (isAfter(parseISO(payPeriodStart), parseISO(payPeriodEnd))) {
        setRangeError("⚠️ End date cannot be before the start date.");
        setPayStatuses({});
        return;
      }

      // If no employees loaded, nothing to do yet
      if (employees.length === 0) return;

      // Show "Checking..." while we fetch
      const initialStatuses: PayStatuses = {};
      for (const e of employees) initialStatuses[e.employeeId] = "Checking...";
      setPayStatuses(initialStatuses);

      // ---- KEY FIXES START HERE ----
      // We fetch all paystubs whose payPeriod.start is inside the selected range
      // and then group by empId and month key.
      const paystubsRef = collection(db, "paystubs");
      const qAll = query(
        paystubsRef,
        where("payPeriod.start", ">=", payPeriodStart),
        where("payPeriod.start", "<=", payPeriodEnd)
      );
      const stubSnap = await getDocs(qAll);

      // Map: empId -> Set of "yyyy-MM" months that have a stub
      const monthsByEmp: Map<string, Set<string>> = new Map();

      stubSnap.forEach((docSnap) => {
        const d = docSnap.data() as {
          empId?: string;
          payPeriod?: { start?: string; end?: string };
        };

        const eid = d.empId; // <<<<<<<<<< use empId (NOT uid)
        const start = d.payPeriod?.start;

        if (!eid || !start) return;

        const monthKey = format(parseISO(start), "yyyy-MM");
        if (!monthsByEmp.has(eid)) monthsByEmp.set(eid, new Set<string>());
        monthsByEmp.get(eid)!.add(monthKey);
      });

      // Now decide per employee: Paid if every required month exists
      const nextStatuses: PayStatuses = {};
      for (const emp of employees) {
        const hadMonths = monthsByEmp.get(emp.employeeId) ?? new Set<string>();
        const allMonthsExist =
          requiredMonths.length > 0 &&
          requiredMonths.every((m) => hadMonths.has(m));

        nextStatuses[emp.employeeId] = allMonthsExist ? "Paid" : "Pending";
      }

      setPayStatuses(nextStatuses);
      // ---- KEY FIXES END HERE ----
    };

    run();
  }, [employees, payPeriodStart, payPeriodEnd, requiredMonths]);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-100 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/hr/dashboard"
          className="inline-block mb-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 font-semibold transition"
        >
          ← Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
            📋 Payroll - Employee Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Pick a pay period, then check or open any employee to process their paystub.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-4 flex flex-wrap gap-6">
          <div className="flex flex-col">
            <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">
              Pay Period Start
            </label>
            <input
              type="date"
              value={payPeriodStart}
              onChange={(e) => setPayPeriodStart(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex flex-col">
            <label className="block text-gray-700 dark:text-gray-200 font-semibold mb-1">
              Pay Period End
            </label>
            <input
              type="date"
              value={payPeriodEnd}
              onChange={(e) => setPayPeriodEnd(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {rangeError && (
          <p className="text-red-600 dark:text-red-400 mb-4">{rangeError}</p>
        )}

        <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-blue-100 dark:bg-gray-700 text-gray-700 dark:text-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">EMP ID</th>
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Department</th>
                <th className="text-left px-4 py-3 font-semibold">Position</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Pay Status</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, index) => {
                const status = payStatuses[emp.employeeId] ?? "Checking...";
                const showBadge = payPeriodStart && payPeriodEnd;

                return (
                  <tr
                    key={emp.uid || `${emp.employeeId}-${index}`}
                    className={
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-800"
                        : "bg-gray-50 dark:bg-gray-700"
                    }
                  >
                    <td className="px-4 py-3 text-gray-800 dark:text-white">{emp.employeeId}</td>
                    <td className="px-4 py-3 text-gray-800 dark:text-white">{emp.name}</td>
                    <td className="px-4 py-3 text-gray-800 dark:text-white">{emp.email}</td>
                    <td className="px-4 py-3 text-gray-800 dark:text-white">{emp.department}</td>
                    <td className="px-4 py-3 text-gray-800 dark:text-white">{emp.position}</td>
                    <td className="px-4 py-3">
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs font-semibold px-3 py-1 rounded-full">
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {showBadge ? (
                        <span
                          className={`px-3 py-1 text-xs font-bold rounded-full ${
                            status === "Paid"
                              ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
                              : status === "Pending"
                              ? "bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200"
                              : "bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {status}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">
                          No period
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/hr/payroll/${emp.employeeId}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded shadow-sm transition"
                      >
                        View Paystub
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {employees.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
            No employees found.
          </p>
        )}
      </div>
    </div>
  );
}
