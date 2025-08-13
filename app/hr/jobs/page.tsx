"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import {
  HiOutlineArrowLeft,
  HiOutlineBriefcase,
  HiOutlineBuildingOffice,
  HiOutlineMapPin,
  HiOutlineDocumentText,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineArrowDownTray,
} from "react-icons/hi2";

import { detectBadWords } from "@/lib/azureAI";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  jobType: string;
  experience: string;
  startDate: string; // yyyy-MM-dd
  deadline: string;  // yyyy-MM-dd
  status: string;
  description: string;
  postedBy: string;
  createdAt?: Timestamp | null;
  applicantCount: number;
}

const departments = [
  "Manufacturing",
  "Dispatch",
  "QC",
  "Production",
  "Sales",
  "HR",
  "Admin",
  "Logistics",
];

const jobTypes = ["Full-time", "Part-time", "Contract", "Internship"];
const experienceLevels = ["Entry", "Mid", "Senior", "Manager"];
const statuses = ["Open", "Closed"];

export default function JobsPage() {
  // Form state
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [experience, setExperience] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("Open");
  const [description, setDescription] = useState("");

  // Page state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;

  useEffect(() => {
    fetchJobs();

  }, []);

  const fetchJobs = async () => {
    try {
      const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const jobList: Job[] = snapshot.docs.map((d) => {
        const data = d.data() as Omit<Job, "id" | "applicantCount">;
        return {
          id: d.id,
          ...data,
          applicantCount: Math.floor(Math.random() * 50) + 1, // demo count
        };
      });

      setJobs(jobList);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load jobs.");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDepartment("");
    setLocation("");
    setJobType("");
    setExperience("");
    setStartDate("");
    setDeadline("");
    setDescription("");
    setStatus("Open");
    setEditingId(null);
    setError("");
  };

  const handlePostJob = async () => {
    setError("");

    // Required fields
    if (
      !title ||
      !department ||
      !location ||
      !jobType ||
      !experience ||
      !startDate ||
      !deadline ||
      !description
    ) {
      toast.error("⚠ Please fill in all fields.");
      return;
    }

    // Date validation
    if (new Date(deadline) < new Date(startDate)) {
      toast.error("⚠ Deadline cannot be before the Start Date.");
      return;
    }

    // AI moderation for multiple fields
    const fieldsToCheck = [
      { label: "Title", value: title },
      { label: "Department", value: department },
      { label: "Location", value: location },
      { label: "Job Type", value: jobType },
      { label: "Experience", value: experience },
      { label: "Description", value: description },
    ];

    const failedFields: string[] = [];
    for (const field of fieldsToCheck) {
      const cleaned = field.value
        .toLowerCase()
        .replace(/[^a-z0-9 ]/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      // If detectBadWords returns true when inappropriate:
      const isBad = await detectBadWords(cleaned);
      if (isBad) failedFields.push(field.label);
    }

    if (failedFields.length > 0) {
      toast.error(
        `🚫 Inappropriate content in:\n${failedFields
          .map((f) => `• ${f}`)
          .join("\n")}`
      );
      return;
    }

    const jobData = {
      title,
      department,
      location,
      jobType,
      experience,
      startDate,
      deadline,
      status,
      description,
      postedBy: "hr@bhalariaworks.com",
      createdAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "jobs", editingId), jobData);
        toast.success("✅ Job updated successfully!");
      } else {
        await addDoc(collection(db, "jobs"), jobData);
        toast.success("✅ Job posted successfully!");
      }
      resetForm();
      fetchJobs();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to submit job.");
    }
  };

  const handleEdit = (job: Job) => {
    setEditingId(job.id);
    setTitle(job.title || "");
    setDepartment(job.department || "");
    setLocation(job.location || "");
    setJobType(job.jobType || "");
    setExperience(job.experience || "");
    setStartDate(job.startDate || "");
    setDeadline(job.deadline || "");
    setStatus(job.status || "Open");
    setDescription(job.description || "");
    setError("");
  };

  const handleDelete = async (id: string) => {
    const confirmDel = window.confirm(
      "Are you sure you want to delete this job?"
    );
    if (!confirmDel) return;
    try {
      await deleteDoc(doc(db, "jobs", id));
      toast.success("🗑️ Job deleted.");
      fetchJobs();
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Delete failed.");
    }
  };

  const exportToExcel = () => {
    const rows = jobs.map((job) => ({
      Title: job.title,
      Department: job.department,
      Type: job.jobType,
      Experience: job.experience,
      Location: job.location,
      "Start Date": job.startDate,
      Deadline: job.deadline,
      Status: job.status,
      Applicants: job.applicantCount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jobs");
    XLSX.writeFile(wb, "job_postings.xlsx");
  };

  // Filters
  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      job.title.toLowerCase().includes(q) ||
      job.description.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q);
    const matchDept = filterDept ? job.department === filterDept : true;
    const matchStatus = filterStatus ? job.status === filterStatus : true;
    return matchSearch && matchDept && matchStatus;
  });

  // Pagination
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 text-gray-800">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Back */}
        <Link
          href="/hr/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <HiOutlineArrowLeft className="mr-1" /> Back to Dashboard
        </Link>

        {/* Job Form */}
        <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
          <h1 className="text-2xl font-semibold text-blue-700 flex items-center gap-2">
            <HiOutlineBriefcase className="text-2xl" />
            {editingId ? "Edit Job Posting" : "Post a Job Opening"}
          </h1>

          {error && (
            <p className="text-red-600 text-sm flex items-center gap-1">
              <HiOutlineExclamationTriangle /> {error}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Job Title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Production Line Supervisor"
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Department *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2 border rounded-md bg-white"
              >
                <option value="">Select Department</option>
                {departments.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Type */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Job Type *
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full px-4 py-2 border rounded-md bg-white"
              >
                <option value="">Select Job Type</option>
                {jobTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Experience Level *
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full px-4 py-2 border rounded-md bg-white"
              >
                <option value="">Select Experience</option>
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Location *
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Bhalaria Unit 2"
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Application Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Application Deadline *
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Job Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border rounded-md bg-white"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Job Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief job responsibilities, skills, experience, etc."
                rows={4}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
          </div>

          {/* Button group */}
          <div className="flex flex-wrap gap-4 mt-6">
            <button
              onClick={handlePostJob}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition"
            >
              {editingId ? "Update Job" : "Post Job"}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="text-red-600 font-medium hover:underline"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {/* Filters + Export */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <input
            placeholder="🔍 Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border rounded w-full sm:w-1/2"
          />
          <div className="flex gap-2">
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-2 border rounded bg-white"
            >
              <option value="">All Departments</option>
              {departments.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded bg-white"
            >
              <option value="">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow"
            >
              <HiOutlineArrowDownTray /> Export
            </button>
          </div>
        </div>

        {/* Job Listings */}
        <div>
          <h2 className="text-lg font-semibold mt-4 text-gray-800 flex items-center gap-2">
            <HiOutlineDocumentText className="text-xl" /> Current Job Listings
          </h2>

          {currentJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white mt-4 p-5 border border-gray-200 rounded-lg shadow-sm"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-blue-700">{job.title}</h3>
                <Link
                  href={`/hr/jobs/${job.id}`}
                  className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  View
                </Link>
              </div>

              <div className="text-sm text-gray-600 flex flex-wrap gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <HiOutlineBuildingOffice /> {job.department}
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineMapPin /> {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineBriefcase /> {job.jobType}
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineUser /> {job.experience}
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineClock /> Applicants: {job.applicantCount}
                </span>
              </div>

              <p className="text-sm mt-2">{job.description}</p>

              <p className="text-xs text-gray-500 mt-1">
                Start: {job.startDate} | Deadline: {job.deadline}
              </p>

              <p className="text-xs text-gray-500">
                Posted by {job.postedBy} on{" "}
                {job.createdAt?.toDate
                  ? format(job.createdAt.toDate(), "PPP")
                  : "..."}
              </p>

              <div className="flex gap-4 mt-3">
                <button
                  onClick={() => handleEdit(job)}
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <HiOutlinePencil /> Edit
                </button>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="text-red-600 hover:underline flex items-center gap-1"
                >
                  <HiOutlineTrash /> Delete
                </button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ToastContainer position="top-center" autoClose={4000} />
    </div>
  );
}
