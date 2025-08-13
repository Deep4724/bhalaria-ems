"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { detectBadWords } from "@/lib/azureAI";
import { ArrowLeftIcon } from "lucide-react";

export default function ApplyJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const jobId = searchParams?.get("pageId") || "";
  if (!jobId)
    return (
      <div className="p-6 text-center text-red-600">
        ❌ Invalid or missing job ID.
      </div>
    );

  // --- Validators ---
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.(com)$/.test(email);
  const isOnlyLetters = (text: string) => /^[A-Za-z\s]+$/.test(text);
  const isOnlyNumbers = (text: string) => /^[0-9]+$/.test(text);

  // --- File Upload Handler ---
  const handleResumeUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      submitApplication(base64);
    };
    reader.onerror = () => alert("Failed to read resume file.");
    reader.readAsDataURL(file);
  };

  // --- Main Submission Logic ---
  const submitApplication = async (resumeBase64: string) => {
    // Basic synchronous validations
    if (!isOnlyLetters(name))
      return alert("Full name can contain only letters.");
    if (!isValidEmail(email))
      return alert("Please enter a valid email ending with .com.");
    if (!isOnlyNumbers(phone))
      return alert("Phone number should contain digits only.");

    // --- Bad Word Filtering (async, all fields) ---
    const fieldsToCheck = [
      { label: "Full Name", value: name },
      { label: "Email", value: email },
      { label: "Phone", value: phone },
      { label: "Education", value: education },
      { label: "Experience", value: experience },
      { label: "Cover Letter", value: coverLetter },
    ];

    // Call all async bad word checks in parallel
    const results = await Promise.all(
      fieldsToCheck.map(async (field) => {
        if (!field.value.trim()) return null; // skip empty fields
        const isBad = await detectBadWords(field.value);
        return isBad ? field.label : null;
      })
    );
    // If any field fails, block the submission
    const failedFields = results.filter((field): field is string =>
      Boolean(field)
    );
    if (failedFields.length > 0) {
      alert(
        `🚫 Inappropriate language detected in:\n${failedFields
          .map((f) => `• ${f}`)
          .join("\n")}`
      );
      return; // Block submission!
    }

    // --- Firestore Write ---
    await addDoc(collection(db, "applications"), {
      jobId,
      name,
      email,
      phone,
      education,
      experience,
      coverLetter,
      resumeUrl: resumeBase64,
      status: "Pending",
      createdAt: serverTimestamp(),
      employeeId: localStorage.getItem("employeeId") || "",
    });

    alert("✅ Application submitted successfully!");
    router.push("/employee/job");
  };

  // --- Submit Handler ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resumeFile) handleResumeUpload(resumeFile);
    else submitApplication("");
  };

  return (
    <div className="min-h-screen bg-blue-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:underline text-sm font-medium"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Jobs
        </button>
        <h1 className="text-3xl font-bold text-blue-800 flex items-center gap-2">
          📋 Apply for this Job
        </h1>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              className="border px-4 py-2 rounded-lg text-black"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="border px-4 py-2 rounded-lg text-black"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              className="border px-4 py-2 rounded-lg text-black"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <input
              className="border px-4 py-2 rounded-lg text-black"
              placeholder="Education"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              required
            />
          </div>
          <input
            className="border px-4 py-2 rounded-lg text-black"
            placeholder="Experience"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            required
          />
          <textarea
            className="border px-4 py-2 rounded-lg text-black"
            placeholder="Cover Letter (optional)"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={4}
          />
          <div>
            <label className="text-sm font-medium mb-1 text-gray-700">
              Upload Resume (PDF only)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="border px-3 py-2 rounded-lg w-full text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Submit Application
          </button>
        </form>
      </div>
    </div>
  );
}
