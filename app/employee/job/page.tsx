"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import Link from "next/link";

// 🔧 Job interface
interface JobPost {
  id: string;
  title: string;
  department: string;
  description: string;
  location: string;
  postedBy: string;
  createdAt: import("firebase/firestore").Timestamp;
}

export default function JobBoardPage() {
  const [jobs, setJobs] = useState<JobPost[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const jobList = snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<JobPost, "id">;
        return {
          ...data,
          id: doc.id,
        };
      });

      setJobs(jobList);
    };

    fetchJobs();
  }, []);

  return (
    <div className="p-6 sm:p-8 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* 🔷 Page Title */}
      <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-700 dark:text-blue-400 mb-8 flex items-center gap-2">
        📋 Job Postings
      </h1>

      {/* 🟦 Job Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700 transition duration-300"
          >
            <div className="p-5">
              {/* 🧩 Title */}
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-1">
                {job.title}
              </h2>

              {/* 🏢 Department & Location */}
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {job.department}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {job.location}
              </p>

              {/* 📃 Description */}
              <p className="text-sm text-gray-700 dark:text-gray-200 mb-4 line-clamp-3">
                {job.description}
              </p>

              {/* 🕓 Metadata */}
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Posted by <span className="font-medium">{job.postedBy}</span> on{" "}
                {new Date(job.createdAt?.seconds * 1000).toLocaleDateString()}
              </p>

              {/* ✅ Apply Button */}
              <div className="text-right">
                <Link href={`/employee/job/apply?pageId=${job.id}`}>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition duration-200">
                    Apply
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
