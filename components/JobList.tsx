"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { format } from "date-fns";

// 🔵 Define the Firestore Job shape (add more fields as you use them)
type Job = {
  id: string;
  title?: string;
  description?: string;
  department?: string;
  location?: string;
  postedBy?: string;
  createdAt?: Timestamp | { toDate: () => Date }; // Firestore Timestamp, or compatible
  // Add other fields if needed
};

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const snapshot = await getDocs(collection(db, "jobs"));
      const data: Job[] = snapshot.docs.map((doc) => {
        const raw = doc.data();
        return {
          id: doc.id,
          title: raw.title as string | undefined,
          description: raw.description as string | undefined,
          department: raw.department as string | undefined,
          location: raw.location as string | undefined,
          postedBy: raw.postedBy as string | undefined,
          createdAt: raw.createdAt as Timestamp | undefined,
          // Add more fields as needed
        };
      });
      setJobs(data);
    };
    fetchJobs();
  }, []);

  if (jobs.length === 0) {
    return <p className="text-gray-500 text-sm">No job postings found.</p>;
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="border border-blue-200 rounded-md bg-blue-50 p-4 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-blue-700">
            {job.title ?? "Untitled"}
          </h3>
          <p className="text-sm text-gray-600 mb-1">
            📌 {job.department ?? "Unknown Department"} —{" "}
            {job.location ?? "Unknown Location"}
          </p>
          <p className="text-sm text-gray-800 mb-1">
            {job.description ?? "No description"}
          </p>
          <p className="text-xs text-gray-500">
            Posted by{" "}
            <span className="font-medium text-gray-700">
              {job.postedBy ?? "Unknown"}
            </span>{" "}
            on{" "}
            {job.createdAt && typeof job.createdAt.toDate === "function"
              ? format(job.createdAt.toDate(), "PPP")
              : "N/A"}
          </p>
        </div>
      ))}
    </div>
  );
}
