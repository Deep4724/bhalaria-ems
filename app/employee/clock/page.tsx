"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import toast, { Toaster } from "react-hot-toast";

export default function ClockPage() {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [recordId, setRecordId] = useState("");
  const [employeeInfo, setEmployeeInfo] = useState({
    fullName: "",
    employeeId: "",
    uid: "",
    department: "",
    email: "",
  });

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user) return;

      const empSnap = await getDocs(
        query(collection(db, "employees"), where("uid", "==", user.uid))
      );
      const empData = empSnap.docs[0]?.data();
      if (!empData) return;

      const uid = user.uid;
      const empEmail = empData.email || user.email || "";

      setEmployeeInfo({
        fullName: empData.fullName || empData.name || "Unknown",
        employeeId: empData.employeeId || "--",
        email: empEmail,
        uid: uid,
        department: empData.department || "Unknown",
      });

      const today = new Date().toISOString().split("T")[0];
      const q = query(
        collection(db, "attendance-records"),
        where("uid", "==", uid),
        where("date", "==", today)
      );
      const snap = await getDocs(q);
      const openRecord = snap.docs.find((doc) => !doc.data().clockOut);

      if (openRecord) {
        const clockInTime = new Date(`${today}T${openRecord.data().clockIn}`);
        const now = new Date();
        const diffMs = now.getTime() - clockInTime.getTime();
        const hours = diffMs / (1000 * 60 * 60);

        if (hours >= 8.15) {
          await updateDoc(doc(db, "attendance-records", openRecord.id), {
            clockOut: now.toLocaleTimeString(),
            markedAt: Timestamp.now(),
            markedBy: user.email || "Auto",
            email: empEmail, // ✅ safe extracted email
          });
          toast.success("⏰ Auto clocked out after 8.15 hours");
        } else {
          setClockedIn(true);
          setRecordId(openRecord.id);
        }
      }
    };

    fetchStatus();
  }, [user]);

  const handleClockIn = async () => {
    if (!employeeInfo.uid) return;
    setLoading(true);
    try {
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = now.toLocaleTimeString();

      const docRef = await addDoc(collection(db, "attendance-records"), {
        uid: employeeInfo.uid,
        fullName: employeeInfo.fullName,
        employeeId: employeeInfo.employeeId,
        email: employeeInfo.email,
        department: employeeInfo.department,
        date,
        clockIn: time,
        markedAt: Timestamp.now(),
        markedBy: user?.email || "Unknown",
      });

      toast.success("✅ Clocked in successfully");
      setRecordId(docRef.id);
      setClockedIn(true);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to clock in");
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      const now = new Date();
      await updateDoc(doc(db, "attendance-records", recordId), {
        clockOut: now.toLocaleTimeString(),
        markedAt: Timestamp.now(),
        markedBy: user?.email || "Unknown",
        email: employeeInfo.email,
      });
      toast.success("✅ Clocked out successfully");
      setClockedIn(false);
      setRecordId("");
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to clock out");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-xl mx-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xl rounded-lg transition-all duration-300">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold text-center text-blue-700 dark:text-blue-400 mb-6">
        🕑 Employee Clock
      </h1>

      <div className="space-y-4 text-center text-sm sm:text-base">
        <p>
          <span className="font-semibold">Name:</span> {employeeInfo.fullName}
        </p>
        <p>
          <span className="font-semibold">Employee ID:</span>{" "}
          {employeeInfo.employeeId}
        </p>
        <p>
          <span className="font-semibold">Email:</span> {employeeInfo.email}
        </p>
        <p>
          <span className="font-semibold">Status:</span>{" "}
          {clockedIn ? (
            <span className="text-green-500 font-medium">Clocked In</span>
          ) : (
            <span className="text-red-500 font-medium">Not Clocked In</span>
          )}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
        <button
          onClick={handleClockIn}
          disabled={clockedIn || loading}
          className={`px-6 py-2 rounded-md font-medium transition duration-200 text-sm sm:text-base ${
            clockedIn || loading
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          Clock In
        </button>
        <button
          onClick={handleClockOut}
          disabled={!clockedIn || loading}
          className={`px-6 py-2 rounded-md font-medium transition duration-200 text-sm sm:text-base ${
            !clockedIn || loading
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          Clock Out
        </button>
      </div>
    </div>
  );
}
