"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Type definition
type Application = {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  education: string;
  experience: string;
  coverLetter?: string;
  resumeUrl?: string;
  status: string;
  createdAt?: Timestamp;
  position?: string;
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          console.error("❌ No logged-in user");
          setLoading(false);
          return;
        }

        // 🔹 Get employeeId from Firestore
        const empQuery = query(
          collection(db, "employees"),
          where("uid", "==", user.uid)
        );
        const empSnap = await getDocs(empQuery);

        if (empSnap.empty) {
          console.error("❌ Employee not found in Firestore");
          setLoading(false);
          return;
        }

        const employeeId = empSnap.docs[0].data().employeeId;
        if (!employeeId) {
          console.error("❌ No employeeId found for this user");
          setLoading(false);
          return;
        }

        // 🔹 Fetch applications linked to employeeId
        const q = query(
          collection(db, "applications"),
          where("employeeId", "==", employeeId)
        );
        const snapshot = await getDocs(q);

        const appsWithPosition: Application[] = [];

        for (const docSnap of snapshot.docs) {
          const appData = docSnap.data() as Omit<Application, "id">;
          const jobId = appData.jobId;

          // Fetch job title
          const jobRef = doc(db, "jobs", jobId);
          const jobSnap = await getDoc(jobRef);

          const position = jobSnap.exists()
            ? (jobSnap.data().title as string) || "Unknown Position"
            : "Unknown Position";

          appsWithPosition.push({
            id: docSnap.id,
            ...appData,
            position,
          });
        }

        setApplications(appsWithPosition);
      } catch (err) {
        console.error("❌ Error fetching applications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-700 dark:text-gray-300">
        Loading applications...
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-[#0f172a] transition-colors duration-300">
      <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-6">
        📄 My Applications
      </h1>

      {applications.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          You haven’t applied to any jobs yet.
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-2">
          {applications.map((app) => (
            <div
              key={app.id}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-md bg-white dark:bg-gray-900 transition-all"
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    Position: {app.position}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Applied on:{" "}
                    {app.createdAt?.toDate?.().toLocaleString?.() || "N/A"}
                  </p>
                </div>

                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                    app.status === "Pending"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-300/10 dark:text-yellow-300"
                      : app.status === "Accepted"
                      ? "bg-green-100 text-green-800 dark:bg-green-300/10 dark:text-green-300"
                      : "bg-red-100 text-red-800 dark:bg-red-300/10 dark:text-red-300"
                  }`}
                >
                  {app.status}
                </span>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-1">
                  <strong>Education:</strong> {app.education}
                </p>
                <p>
                  <strong>Experience:</strong> {app.experience}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}