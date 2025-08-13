"use client";

import { useState } from "react";
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
import { FaUserPlus } from "react-icons/fa";
import Image from "next/image";
import { fetchSignInMethodsForEmail } from "firebase/auth";
import { FirebaseError } from "firebase/app";

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

const statuses = ["Active", "Inactive"];

export default function AddEmployeePage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    role: "Employee",
    status: "Active",
    dob: "",
    about: "",
    photo: null as File | null,
  });

  const [loading, setLoading] = useState(false);
  const [previewURL, setPreviewURL] = useState<string | null>(null);

  // ✅ Form validation
  const validate = () => {
    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      position,
      dob,
      role,
    } = form;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !department ||
      !position ||
      !dob ||
      !role
    ) {
      toast.error("Please fill in all required fields.");
      return false;
    }
    return true;
  };

  // ✅ Submit handler
  const handleSubmit = async () => {
    // ✅ Basic validation
    if (!validate()) return;
    setLoading(true);

    try {
      const fullName = `${form.firstName} ${form.lastName}`;

      // ✅ Check if email already exists
      const existingMethods = await fetchSignInMethodsForEmail(
        auth,
        form.email
      );
      if (existingMethods.length > 0) {
        toast.error("🚫 This email is already registered.");
        setLoading(false);
        return;
      }

      // ✅ Generate employee ID
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

      // ✅ Create user in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        "welcome123"
      );

      // ✅ Send reset password link as invitation
      await sendPasswordResetEmail(auth, form.email);

      // ✅ Save user data to Firestore
      await addDoc(collection(db, "employees"), {
        uid: userCred.user.uid,
        fullName,
        email: form.email,
        phone: form.phone,
        department: form.department,
        position: form.position,
        role: form.role,
        status: form.status,
        joinDate: new Date().toLocaleDateString(),
        dob: form.dob,
        about: form.about,
        employeeId,
        createdAt: Timestamp.now(),
      });

      toast.success("✅ Employee added and invite sent.");

      // ✅ Reset form
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        department: "",
        position: "",
        role: "Employee",
        status: "Active",
        dob: "",
        about: "",
        photo: null,
      });
      setPreviewURL(null);
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        if (err.code === "auth/email-already-in-use") {
          toast.error("🚫 This email is already in use.");
        } else {
          toast.error(`❌ ${err.message}`);
        }
      } else {
        console.error("❌ Unknown error:", err);
        toast.error("Failed to create employee.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-lg shadow">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FaUserPlus className="text-blue-600" /> Add Employee
        </h1>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upload photo */}
        <div className="md:col-span-2 flex flex-col items-center border rounded-md p-4">
          {previewURL ? (
            <Image
              src={previewURL}
              alt="Profile Preview"
              width={120}
              height={120}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-28 h-28 border rounded-full flex items-center justify-center text-gray-400">
              No Photo
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setForm({ ...form, photo: file });
                setPreviewURL(URL.createObjectURL(file));
              }
            }}
            className="mt-3"
          />
        </div>

        <input
          type="text"
          placeholder="First Name"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="ID"
          value={"Auto-generated"}
          disabled
          className="border p-2 rounded bg-gray-100"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="border p-2 rounded"
        />
        <select
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept}>{dept}</option>
          ))}
        </select>
        <select
          value={form.position}
          onChange={(e) => setForm({ ...form, position: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">Select Designation</option>
          <option value="Manager">Manager</option>
          <option value="Engineer">Engineer</option>
          <option value="Operator">Operator</option>
          <option value="Intern">Intern</option>
        </select>
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="border p-2 rounded"
        >
          {roles.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <input
          type="date"
          placeholder="Date of Birth"
          value={form.dob}
          onChange={(e) => setForm({ ...form, dob: e.target.value })}
          className="border p-2 rounded"
        />
        <textarea
          placeholder="About Me"
          value={form.about}
          onChange={(e) => setForm({ ...form, about: e.target.value })}
          className="border p-2 rounded md:col-span-2"
        ></textarea>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="border p-2 rounded"
        >
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() =>
            setForm({
              firstName: "",
              lastName: "",
              email: "",
              phone: "",
              department: "",
              position: "",
              role: "Employee",
              status: "Active",
              dob: "",
              about: "",
              photo: null,
            })
          }
          className="px-6 py-2 border border-gray-400 text-gray-700 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
