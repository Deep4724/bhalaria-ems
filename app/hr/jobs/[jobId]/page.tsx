"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { format } from "date-fns";

// ✅ Job type interface to remove "any"
interface Job {
  title: string;
  department: string;
  location: string;
  jobType: string;
  experience: string;
  startDate: string;
  deadline: string;
  status: string;
  description: string;
  postedBy: string;
  createdAt?: {
    toDate: () => Date;
  };
}

export default function JobDetailPage() {
  const { jobId } = useParams() as { jobId: string };

  // ✅ use proper Job interface instead of `any`
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      try {
        if (!jobId) return;

        const ref = doc(db, "jobs", jobId);
        const snapshot = await getDoc(ref);

        if (snapshot.exists()) {
          setJob(snapshot.data() as Job); // ✅ cast to Job
        } else {
          setError("Job not found.");
        }
      } catch (err) {
        console.error("Error fetching job:", err);
        setError("Failed to load job details.");
      }
    };

    fetchJob();
  }, [jobId]);

  if (error) return <div className="p-10 text-red-500">{error}</div>;

  if (!job)
    return <div className="p-10 text-gray-500">Loading job details...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-6 text-gray-800">
      <div className="max-w-4xl mx-auto space-y-6 bg-white p-8 rounded-2xl shadow-lg border">
        <Link
          href="/hr/jobs"
          className="text-blue-600 hover:underline text-sm mb-2 inline-block"
        >
          ← Back to Job Listings
        </Link>

        <div className="flex flex-wrap justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-blue-700">{job.title}</h1>
          <span
            className={`text-sm font-medium px-3 py-1 rounded-full ${
              job.status === "Open"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {job.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 mt-2">
          <p>
            <strong>📍 Location:</strong> {job.location}
          </p>
          <p>
            <strong>🏢 Department:</strong> {job.department}
          </p>
          <p>
            <strong>💼 Type:</strong> {job.jobType}
          </p>
          <p>
            <strong>👤 Experience:</strong> {job.experience}
          </p>
          <p>
            <strong>📅 Start Date:</strong> {job.startDate}
          </p>
          <p>
            <strong>⏳ Deadline:</strong> {job.deadline}
          </p>
          <p>
            <strong>📝 Posted By:</strong> {job.postedBy}
          </p>
          <p>
            <strong>📌 Posted On:</strong>{" "}
            {job.createdAt?.toDate?.()
              ? format(job.createdAt.toDate(), "PPP")
              : "N/A"}
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">
            📝 Job Description
          </h2>
          <p className="text-gray-700 leading-relaxed">{job.description}</p>
        </div>
      </div>
    </div>
  );
}
