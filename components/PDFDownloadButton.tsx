"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import PaystubPDF from "./PaystubPDF";
import { HiDownload } from "react-icons/hi";

// This should match your Employee type used in PaystubPDF!
type Employee = {
  id: string;
  empId: string;
  name: string;
  email: string;
  position: string;
  department: string;
  status: string;
  joinDate: string;
};

interface Props {
  employee: Omit<Employee, "id">; // Accepts everything except "id"
  payDetails: {
    baseRate: number;
    hoursWorked: number;
    overtime: number;
    bonus: number;
    deductions: number;
    tax: number;
    netPay: number;
    payPeriodStart: string;
    payPeriodEnd: string;
  };
}

export default function PDFDownloadButton({ employee, payDetails }: Props) {
  // Always add "id" when passing to PaystubPDF
  const employeeWithId: Employee = {
    id: employee.empId || "unknown",
    ...employee,
  };

  return (
    <PDFDownloadLink
      document={
        <PaystubPDF employee={employeeWithId} payDetails={payDetails} />
      }
      fileName={`${employee.empId}_paystub.pdf`}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm rounded shadow flex items-center space-x-2"
    >
      {({ loading }) => (
        <>
          <HiDownload />
          <span>{loading ? "Preparing..." : "Download PDF"}</span>
        </>
      )}
    </PDFDownloadLink>
  );
}
