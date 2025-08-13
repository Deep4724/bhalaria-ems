"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Font registration
Font.register({
  family: "Helvetica-Bold",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/helvetica/v15/Ycm9sF4I4lK8a6F2.ttf",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
    backgroundColor: "#f9fafb",
  },
  header: {
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 25,
    color: "#6b7280",
  },
  section: {
    marginBottom: 18,
    padding: 10,
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "bold",
    color: "#1f2937",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    color: "#374151",
  },
  value: {
    fontWeight: "bold",
    color: "#111827",
  },
  netPay: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
    color: "#16a34a",
    marginTop: 10,
    padding: 8,
    backgroundColor: "#ecfdf5",
    borderRadius: 4,
  },
});

// Strict Employee type
type Employee = {
  id: string;
  name: string;
  email: string;
  empId?: string; // for compatibility with your code
  employeeId?: string;
  department?: string;
  position?: string;
  status?: string;
  joinDate?: string;
};

type PayDetails = {
  baseRate: number;
  hoursWorked: number;
  overtime: number;
  bonus: number;
  deductions: number;
  payPeriodStart: string;
  payPeriodEnd: string;
};

type Props = {
  employee: Employee;
  payDetails: PayDetails;
};

export default function PaystubPDF({ employee, payDetails }: Props) {
  const {
    baseRate,
    hoursWorked,
    overtime,
    bonus,
    deductions,
    payPeriodStart,
    payPeriodEnd,
  } = payDetails;

  const gross = baseRate * hoursWorked;
  const totalEarnings = gross + overtime + bonus;
  const tax = gross > 62500 ? parseFloat((gross * 0.05).toFixed(2)) : 0;
  const netPay = totalEarnings - deductions - tax;

  // Prefer empId, fallback to employeeId, fallback to '-'
  const employeeId =
    employee.empId ?? employee.employeeId ?? employee.id ?? "-";

  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.header}>Bhalaria Works – Official Paystub</Text>
        <Text style={styles.subHeader}>
          Pay Period: {payPeriodStart} – {payPeriodEnd}
        </Text>

        {/* EMPLOYEE DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Employee Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Employee ID</Text>
            <Text style={styles.value}>{employeeId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{employee.name ?? "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{employee.email ?? "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Department</Text>
            <Text style={styles.value}>{employee.department ?? "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Position</Text>
            <Text style={styles.value}>{employee.position ?? "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{employee.status ?? "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Join Date</Text>
            <Text style={styles.value}>{employee.joinDate ?? "-"}</Text>
          </View>
        </View>

        {/* PAYROLL DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💵 Payroll Breakdown</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Base Rate (₹/hr)</Text>
            <Text style={styles.value}>{baseRate}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Hours Worked</Text>
            <Text style={styles.value}>{hoursWorked}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Overtime Bonus (₹)</Text>
            <Text style={styles.value}>{overtime}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Bonus (₹)</Text>
            <Text style={styles.value}>{bonus}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Deductions (₹)</Text>
            <Text style={styles.value}>-{deductions}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tax (5%)</Text>
            <Text style={styles.value}>-{tax}</Text>
          </View>
        </View>

        {/* NET PAY */}
        <Text style={styles.netPay}>
          Net Pay: ₹{netPay.toLocaleString("en-IN")}
        </Text>
      </Page>
    </Document>
  );
}
