"use client";

import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const badWords = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "slut",
  "dick",
  "motherfucker",
];

const departments = [
  "Manufacturing",
  "Dispatch",
  "Maintenance",
  "Production",
  "Admin",
  "HR",
  "Warehouse",
  "Security",
  "Quality Control",
];
type FormElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
export default function JobForm() {
  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    description: "",
    postedBy: "hr@bhalariaworks.com",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<FormElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const containsBadWords = (text: string): boolean => {
    const lower = text.toLowerCase();
    return badWords.some((word) => lower.includes(word));
  };

  const handleSubmit = async () => {
    if (
      !form.title ||
      !form.department ||
      !form.location ||
      !form.description
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (containsBadWords(form.description)) {
      setError("Job description contains inappropriate or offensive language.");
      return;
    }

    try {
      await addDoc(collection(db, "jobs"), {
        ...form,
        createdAt: Timestamp.now(),
      });
      setSuccess("✅ Job posted successfully!");
      setForm({
        title: "",
        department: "",
        location: "",
        description: "",
        postedBy: "hr@bhalariaworks.com",
      });
    } catch (err) {
      console.error("Error posting job:", err);
      setError("Something went wrong. Try again later.");
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold text-blue-700 mb-4">
        📢 Post a Job Opening
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Job Title *
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g., Production Line Supervisor"
            className="w-full mt-1 px-3 py-2 border rounded text-gray-800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Department *
          </label>
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            className="w-full mt-1 px-3 py-2 border rounded text-gray-800"
          >
            <option value="">-- Select Department --</option>
            {departments.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Location *
          </label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="e.g., Unit 2, Bhalaria Works Campus, Mumbai"
            className="w-full mt-1 px-3 py-2 border rounded text-gray-800"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Job Description *
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="Brief job responsibilities"
            className="w-full mt-1 px-3 py-2 border rounded text-gray-800"
          />
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-2">{success}</p>}

      <button
        onClick={handleSubmit}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow-sm"
      >
        Post Job
      </button>
    </div>
  );
}
