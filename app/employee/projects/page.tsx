"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  arrayUnion,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";
import { FaCalendarAlt, FaClipboardList } from "react-icons/fa";

// ✅ Types
interface ProjectLog {
  timestamp: string;
  status: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  deadline: string;
  department: string;
  assignedTo: string[];
  assignedNames: string[];
  status: string;
  logs: ProjectLog[];
}

export default function EmployeeProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "projects"),
      where("assignedTo", "array-contains", uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Project[];
      setProjects(data);
    });

    return () => unsub();
  }, [uid]);

  const statusColor = (status: string): string => {
    switch (status) {
      case "Pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "In Progress":
        return "text-blue-600 dark:text-blue-400";
      case "Completed":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-300";
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "projects", id), {
        status: newStatus,
        logs: arrayUnion({
          timestamp: new Date().toISOString(),
          status: newStatus,
        }),
      });
      toast.success(`✅ Status updated to ${newStatus}`);
    } catch (err) {
      toast.error("❌ Failed to update status");
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 bg-white dark:bg-gray-900 rounded-md shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-blue-700 dark:text-blue-400 flex items-center gap-2">
        <FaClipboardList /> My Projects
      </h1>

      {projects.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">
          No assigned projects found.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
                {proj.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {proj.description}
              </p>

              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <FaCalendarAlt /> {new Date(proj.deadline).toLocaleString()}
              </p>

              <p className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                <span className="font-medium">Department:</span>{" "}
                {proj.department}
              </p>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Status
                </label>
                <select
                  value={proj.status}
                  onChange={(e) => handleStatusChange(proj.id, e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
                <span
                  className={`text-sm font-semibold mt-1 block ${statusColor(
                    proj.status
                  )}`}
                >
                  {proj.status}
                </span>
              </div>

              {proj.logs?.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    📊 Status History
                  </h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc ml-4">
                    {proj.logs.map((log, i) => (
                      <li key={i}>
                        {log.timestamp.split("T")[0]} — {log.status}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
