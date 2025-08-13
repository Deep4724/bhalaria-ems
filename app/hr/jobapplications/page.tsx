"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { FaArrowLeft, FaEye, FaTrashAlt, FaFileExcel } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  createdAt?: Timestamp;
  status: string;
}

export default function JobApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobsMap, setJobsMap] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 6;

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        const [appsSnap, jobsSnap] = await Promise.all([
          getDocs(collection(db, "applications")),
          getDocs(collection(db, "jobs")),
        ]);

        const apps: Application[] = appsSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Application, "id">),
        }));

        apps.sort((a, b) => {
          const aTime = a.createdAt?.toMillis() || 0;
          const bTime = b.createdAt?.toMillis() || 0;
          return bTime - aTime;
        });

        const jobMap: { [key: string]: string } = {};
        jobsSnap.forEach((doc) => {
          const data = doc.data();
          jobMap[doc.id] = data.title || "Untitled";
        });

        setApplications(apps);
        setJobsMap(jobMap);
      } catch {
        toast.error("Failed to load applications or jobs.");
      }

      setLoading(false);
    };

    void loadAll();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    await deleteDoc(doc(db, "applications", id));
    toast.success("Application deleted!");
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };

  const handleExport = () => {
    const data = filteredApps.map((app) => ({
      Name: app.name,
      Email: app.email,
      Phone: app.phone,
      JobTitle: jobsMap[app.jobId] || "Unknown Job",
      AppliedOn: app.createdAt
        ? app.createdAt.toDate().toLocaleString()
        : "N/A",
      Status: app.status,
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Applications");
    XLSX.writeFile(wb, "job_applications.xlsx");
  };

  const filteredApps = applications.filter((app) => {
    const text = `${app.name} ${app.email} ${
      jobsMap[app.jobId] || ""
    }`.toLowerCase();
    const searchMatch = text.includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter ? app.status === statusFilter : true;
    return searchMatch && statusMatch;
  });

  const totalPages = Math.ceil(filteredApps.length / perPage);
  const startIdx = (currentPage - 1) * perPage;
  const paginatedApps = filteredApps.slice(startIdx, startIdx + perPage);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] px-6 py-8 text-gray-900 dark:text-gray-100">
      <ToastContainer />
      <div className="mb-4 flex justify-between items-center">
        <Link
          href="/hr/dashboard"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          <FaArrowLeft className="inline mr-1" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Job Applications</h1>
      </div>

      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <input
          type="text"
          placeholder="Search name, email, job..."
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm rounded text-black dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm rounded text-black dark:text-white"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Reviewed">Reviewed</option>
          <option value="Shortlisted">Shortlisted</option>
          <option value="Rejected">Rejected</option>
        </select>
        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm rounded flex items-center gap-2"
        >
          <FaFileExcel /> Export
        </button>
      </div>

      <p className="text-sm mb-4">
        Showing {paginatedApps.length} of {filteredApps.length} filtered
        applications
      </p>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Loading applications...
        </p>
      ) : filteredApps.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No applications found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedApps.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-xl shadow space-y-2"
            >
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {app.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {app.email}
              </p>
              <p className="text-sm">
                <strong>Job Title:</strong>{" "}
                {jobsMap[app.jobId] || "Unknown Job"}
              </p>
              <p className="text-sm">
                <strong>Applied On:</strong>{" "}
                {app.createdAt
                  ? app.createdAt.toDate().toLocaleString()
                  : "N/A"}
              </p>
              <p className="text-sm">
                <strong>Status:</strong> {app.status}
              </p>
              <div className="flex gap-2 mt-3">
                <Link
                  href={`/hr/jobapplications/${app.id}`}
                  className="flex-1 text-center text-white bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1 rounded"
                >
                  <FaEye className="inline mr-1" /> Preview
                </Link>
                <button
                  onClick={() => handleDelete(app.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded"
                >
                  <FaTrashAlt className="inline mr-1" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:border-gray-600"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 text-sm border rounded ${
                page === currentPage
                  ? "bg-blue-600 text-white"
                  : "dark:border-gray-600"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:border-gray-600"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
