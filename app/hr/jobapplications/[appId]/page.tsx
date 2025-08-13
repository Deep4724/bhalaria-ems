"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FaArrowLeft, FaFilePdf } from "react-icons/fa";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type AppType = {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  status: string;
  experience: string;
  education: string;
  coverLetter: string;
  appliedOn?: Timestamp | string;
  resumeUrl?: string;
};

export default function ApplicationDetailPage() {
  const { appId } = useParams() as { appId: string };

  const [app, setApp] = useState<AppType | null>(null);
  const [jobTitle, setJobTitle] = useState("N/A");
  const [loading, setLoading] = useState(true);

  const fetchApp = async () => {
    try {
      const ref = doc(db, "applications", appId);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const application: AppType = {
          id: snapshot.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          jobId: data.jobId,
          status: data.status,
          experience: data.experience,
          education: data.education,
          coverLetter: data.coverLetter,
          appliedOn: data.createdAt, // ✅ THIS LINE FIXED
          resumeUrl: data.resumeUrl,
        };
        setApp(application);

        if (application.jobId) {
          const jobRef = doc(db, "jobs", application.jobId);
          const jobSnap = await getDoc(jobRef);
          if (jobSnap.exists()) {
            const jobData = jobSnap.data();
            if (jobData.title) setJobTitle(jobData.title);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!app || app.status === newStatus) return;
    const ref = doc(db, "applications", appId);
    await updateDoc(ref, { status: newStatus });
    toast.success(`Status changed to ${newStatus}`);
    fetchApp();
  };

  useEffect(() => {
    void fetchApp();
  });

  if (loading) return <p className="p-6">Loading...</p>;
  if (!app) return <p className="p-6">Application not found.</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 text-gray-800">
      <ToastContainer />
      <div className="mb-6 max-w-4xl mx-auto">
        <Link
          href="/hr/jobapplications"
          className="text-blue-600 hover:underline text-sm"
        >
          <FaArrowLeft className="inline mr-1" />
          Back to Applications
        </Link>
        <h1 className="text-3xl font-bold mt-4">Application Details</h1>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow space-y-4">
        <p>
          <strong>Name:</strong> {app.name}
        </p>
        <p>
          <strong>Email:</strong> {app.email}
        </p>
        <p>
          <strong>Phone:</strong> {app.phone}
        </p>
        <p>
          <strong>Job ID:</strong> {app.jobId}
        </p>
        <p>
          <strong>Job Title:</strong> {jobTitle}
        </p>
        <p>
          <strong>Status:</strong> {app.status}
        </p>
        <p>
          <strong>Experience:</strong> {app.experience}
        </p>
        <p>
          <strong>Education:</strong> {app.education}
        </p>
        <p>
          <strong>Cover Letter:</strong> {app.coverLetter}
        </p>

        <p>
          <strong>Applied On:</strong>{" "}
          {app.appliedOn
            ? typeof app.appliedOn === "string"
              ? new Date(app.appliedOn).toLocaleString()
              : app.appliedOn.toDate().toLocaleString()
            : "N/A"}
        </p>

        {typeof app.resumeUrl === "string" && app.resumeUrl.includes(",") && (
          <div>
            <button
              className="text-blue-600 hover:underline flex items-center gap-2"
              onClick={() => {
                try {
                  const base64 = (app.resumeUrl as string).split(",")[1];
                  const byteArray = new Uint8Array(
                    atob(base64)
                      .split("")
                      .map((char) => char.charCodeAt(0))
                  );
                  const blob = new Blob([byteArray], {
                    type: "application/pdf",
                  });
                  const url = URL.createObjectURL(blob);
                  window.open(url, "_blank");
                } catch {
                  toast.error("Could not preview resume.");
                }
              }}
            >
              <FaFilePdf /> View Resume
            </button>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          {["Reviewed", "Shortlisted", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={app.status === status}
              className={`px-4 py-2 rounded text-sm ${
                app.status === status
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Mark as {status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
