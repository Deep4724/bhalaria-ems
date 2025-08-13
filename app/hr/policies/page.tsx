"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { format } from "date-fns";
import {
  HiOutlineArrowLeft,
  HiOutlineDocumentText,
  HiOutlineTrash,
  HiOutlineArrowDownTray,
  HiOutlineEye,
} from "react-icons/hi2";
import Link from "next/link";
import * as XLSX from "xlsx";

const departments = [
  "All",
  "Manufacturing",
  "HR",
  "Finance",
  "Dispatch",
  "Sales",
  "Production",
];

type Policy = {
  id: string;
  title: string;
  department: string;
  fileName: string;
  fileType: string;
  fileContent: string;
  createdAt?: { toDate: () => Date };
};

export default function PoliciesPage() {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [filterDept, setFilterDept] = useState("All");

  const fetchPolicies = async () => {
    const q = query(collection(db, "policies"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Policy[];
    setPolicies(docs);
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    setError("");
    if (!title || !department || !file) {
      setError("⚠️ All fields are required.");
      return;
    }

    if (
      ![
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ].includes(file.type)
    ) {
      setError("❌ Only PDF, DOCX, or XLSX files are allowed.");
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("❌ File must be under 1MB for Base64 storage.");
      return;
    }

    try {
      setUploading(true);
      const base64 = await readFileAsBase64(file);

      await addDoc(collection(db, "policies"), {
        title,
        department,
        fileName: file.name,
        fileType: file.type,
        fileContent: base64,
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setDepartment("");
      setFile(null);
      fetchPolicies();
    } catch (err) {
      console.error(err);
      setError("❌ Failed to upload policy.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this policy?")) return;
    try {
      await deleteDoc(doc(db, "policies", id));
      fetchPolicies();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete policy.");
    }
  };

  const handleDownload = (fileContent: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileContent;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToExcel = () => {
    const data = policies.map((p) => ({
      Title: p.title,
      Department: p.department,
      UploadedOn: p.createdAt?.toDate?.()
        ? format(p.createdAt.toDate(), "PPP")
        : "---",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Policies");
    XLSX.writeFile(workbook, "Uploaded_Policies.xlsx");
  };

  const filteredPolicies =
    filterDept === "All"
      ? policies
      : policies.filter((p) => p.department === filterDept);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-10">
        <Link
          href="/hr/dashboard"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:underline"
        >
          <HiOutlineArrowLeft className="mr-1" /> Back to Dashboard
        </Link>

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 space-y-5">
          <h1 className="text-xl font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <HiOutlineDocumentText className="text-2xl" /> Upload New Policy
          </h1>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Policy Title *"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-3 py-2"
            />

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded px-3 py-2"
            >
              <option value="">Select Department</option>
              {departments.slice(1).map((dep) => (
                <option key={dep}>{dep}</option>
              ))}
            </select>

            <input
              type="file"
              accept=".pdf,.docx,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full"
            />

            {file && <p className="text-xs text-gray-500 mt-1">{file.name}</p>}

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              {uploading ? "Uploading..." : "Upload Policy"}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-4 py-2 rounded"
          >
            {departments.map((dep) => (
              <option key={dep}>{dep}</option>
            ))}
          </select>

          <button
            onClick={handleExportToExcel}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            📥 Export to Excel
          </button>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Uploaded Policies
          </h2>

          {filteredPolicies.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No policies uploaded yet.
            </p>
          ) : (
            <ul className="divide-y border rounded bg-white dark:bg-gray-800 dark:divide-gray-700 shadow-sm">
              {filteredPolicies.map((policy) => (
                <li
                  key={policy.id}
                  className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-300">
                      {policy.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Dept: {policy.department} — Uploaded on:{" "}
                      {policy.createdAt?.toDate?.()
                        ? format(policy.createdAt.toDate(), "PPP")
                        : "..."}
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    {policy.fileType?.includes("pdf") && (
                      <button
                        onClick={() => setPreviewFile(policy.fileContent)}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
                      >
                        <HiOutlineEye /> Preview
                      </button>
                    )}
                    <button
                      onClick={() =>
                        handleDownload(policy.fileContent, policy.fileName)
                      }
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
                    >
                      <HiOutlineArrowDownTray /> Download
                    </button>
                    <button
                      onClick={() => handleDelete(policy.id)}
                      className="text-red-600 hover:underline text-sm flex items-center gap-1"
                    >
                      <HiOutlineTrash /> Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* PDF Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-900 w-[90%] h-[90%] rounded-lg shadow-lg overflow-hidden relative">
              <button
                onClick={() => setPreviewFile(null)}
                className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded"
              >
                Close
              </button>
              <iframe src={previewFile} className="w-full h-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
