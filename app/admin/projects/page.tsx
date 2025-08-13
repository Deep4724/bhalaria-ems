"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  updateDoc,
  arrayUnion,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";
import CSVExportButton from "@/components/CSVExportButton";
import { FaTrash, FaUsers, FaCalendarAlt } from "react-icons/fa";
import Select from "react-select";
import type { StylesConfig } from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// ✅ Custom calendar input with icon
function CustomCalendarInput({
  value,
  onClick,
}: {
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="flex items-center justify-between w-full p-3 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
    >
      <span>{value || "Select project deadline"}</span>
      <FaCalendarAlt className="ml-2 text-gray-500 dark:text-gray-400" />
    </button>
  );
}

// ✅ Type Definitions
interface Employee {
  id: string;
  fullName: string;
  department: string;
  email?: string;
  uid: string;
}

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

interface OptionType {
  value: string;
  label: string;
}

const departments = [
  "Production",
  "Maintenance",
  "Admin",
  "HR",
  "Dispatch",
  "Quality Control",
  "Packaging",
];

// ✅ Custom styles for react-select to support dark mode
const customSelectStyles: StylesConfig<OptionType, boolean> = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused
      ? "var(--tw-bg-gray-50)"
      : "var(--tw-bg-white)",
    borderColor: "var(--tw-border-gray-300)",
    borderRadius: "0.25rem",
    padding: "0.25rem",
    boxShadow: state.isFocused ? "0 0 0 1px var(--tw-border-blue-500)" : "none",
    "&:hover": {
      borderColor: "var(--tw-border-gray-400)",
    },
    ".dark &": {
      backgroundColor: "var(--tw-bg-gray-700)",
      borderColor: "var(--tw-border-gray-600)",
      color: "var(--tw-text-gray-200)",
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "var(--tw-bg-white)",
    ".dark &": {
      backgroundColor: "var(--tw-bg-gray-700)",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused
      ? "var(--tw-bg-gray-200)"
      : state.isSelected
      ? "var(--tw-bg-blue-500)"
      : "var(--tw-bg-white)",
    color: state.isSelected
      ? "var(--tw-text-white)"
      : "var(--tw-text-gray-800)",
    "&:active": {
      backgroundColor: "var(--tw-bg-blue-600)",
    },
    ".dark &": {
      backgroundColor: state.isFocused
        ? "var(--tw-bg-gray-600)"
        : state.isSelected
        ? "var(--tw-bg-blue-600)"
        : "var(--tw-bg-gray-700)",
      color: state.isSelected
        ? "var(--tw-text-white)"
        : "var(--tw-text-gray-200)",
      "&:active": {
        backgroundColor: "var(--tw-bg-blue-700)",
      },
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "var(--tw-bg-blue-200)",
    ".dark &": {
      backgroundColor: "var(--tw-bg-blue-800)",
    },
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "var(--tw-text-blue-800)",
    ".dark &": {
      color: "var(--tw-text-blue-200)",
    },
  }),
  input: (provided) => ({
    ...provided,
    color: "var(--tw-text-gray-900)",
    ".dark &": {
      color: "var(--tw-text-gray-100)",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "var(--tw-text-gray-500)",
    ".dark &": {
      color: "var(--tw-text-gray-400)",
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "var(--tw-text-gray-900)",
    ".dark &": {
      color: "var(--tw-text-gray-100)",
    },
  }),
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDept, setSelectedDept] = useState<OptionType | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<
    readonly OptionType[]
  >([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string>("");

  // 🔒 Get current admin email
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setCurrentAdminEmail(user.email);
      }
    });
    return () => unsubscribe();
  }, []);

  // 🔄 Real-time project fetch
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "projects"), (snapshot) => {
      const data = snapshot.docs.map(
        (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Project)
      );
      setProjects(data);
    });
    return () => unsub();
  }, []);

  // 👥 Fetch employee list once
  useEffect(() => {
    const fetchEmployees = async () => {
      const snap = await getDocs(collection(db, "employees"));
      const docs = snap.docs.map(
        (docSnap: QueryDocumentSnapshot<DocumentData>) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          } as Employee)
      );
      setEmployees(docs);
    };
    fetchEmployees();
  }, []);

  // 🎨 Department color tag
  const deptColor = (dept: string): string => {
    const map: Record<string, string> = {
      Production:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      Maintenance:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      Admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      HR: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      Dispatch:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "Quality Control":
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
      Packaging:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    };
    return (
      map[dept] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    );
  };

  // 🟢 Status color
  const statusColor = (status: string): string => {
    switch (status) {
      case "Pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "In Progress":
        return "text-blue-600 dark:text-blue-400";
      case "Completed":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-500 dark:text-gray-400";
    }
  };

  // ➕ Create a new project
  const createProject = async () => {
    if (
      !title.trim() ||
      !description.trim() ||
      !deadline ||
      !selectedDept ||
      selectedEmployees.length === 0
    ) {
      toast.error("❌ Please fill all required fields");
      return;
    }

    setLoading(true);

    // ✅ Match selected employees to get uid + fullName
    const selectedEmployeeObjects = employees.filter((emp) =>
      selectedEmployees.some((sel) => sel.value === emp.id)
    );

    // ✅ Real UID list (not Firestore doc ID)
    const assignedTo = selectedEmployeeObjects.map((emp) => emp.uid || emp.id);
    const assignedNames = selectedEmployeeObjects.map((emp) => emp.fullName);

    // 🧪 Debug log
    console.log("✅ Assigned UIDs:", assignedTo);
    console.log("✅ Assigned Names:", assignedNames);

    try {
      await addDoc(collection(db, "projects"), {
        title: title.trim(),
        description: description.trim(),
        deadline: deadline.toISOString(),
        department: selectedDept.value,
        assignedTo, // ✅ Now stores real auth UIDs
        assignedNames,
        status: "Pending",
        logs: [{ timestamp: new Date().toISOString(), status: "Pending" }],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: currentAdminEmail || "Unknown",
      });

      toast.success("✅ Project created");

      // 🔄 Reset form
      setTitle("");
      setDescription("");
      setDeadline(null);
      setSelectedDept(null);
      setSelectedEmployees([]);
    } catch (err) {
      console.error("🔥 Error creating project:", err);
      toast.error("❌ Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete a project
  const deleteProject = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      await deleteDoc(doc(db, "projects", id));
      toast.success("🗑️ Project deleted");
    }
  };

  // 🔁 Update project status
  const updateStatus = async (id: string, newStatus: string) => {
    await updateDoc(doc(db, "projects", id), {
      status: newStatus,
      updatedAt: Timestamp.now(),
      logs: arrayUnion({
        timestamp: new Date().toISOString(),
        status: newStatus,
      }),
    });
    toast.success(`✅ Status updated to ${newStatus}`);
  };

  // 👥 Filter employees by department
  const employeeOptions: OptionType[] = employees
    .filter((e) => e.department === selectedDept?.value)
    .map((e) => ({ value: e.id, label: `${e.fullName} (${e.email})` }));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-500 mb-6">
          📁 Manage Projects
        </h1>

        {/* 🔧 Form for creating project */}
        <div className="grid md:grid-cols-2 gap-4 bg-white dark:bg-gray-800 p-5 rounded shadow mb-10 border dark:border-gray-700">
          <label className="text-sm font-medium dark:text-gray-300">
            Project Title *
          </label>
          <label className="text-sm font-medium dark:text-gray-300">
            Deadline *
          </label>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter project title"
            className="p-3 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          />

          <DatePicker
            selected={deadline}
            onChange={(date: Date | null) => setDeadline(date)}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="yyyy-MM-dd h:mm aa"
            minDate={new Date()}
            placeholderText="Select deadline"
            className="hidden"
            customInput={<CustomCalendarInput />}
            popperPlacement="bottom"
            popperModifiers={[
              {
                name: "offset",
                options: { offset: [0, 10] },
                fn: () => ({}),
              },
            ]}
          />

          <label className="text-sm font-medium col-span-2 dark:text-gray-300">
            Project Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter project details and objectives"
            className="p-3 border rounded md:col-span-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            rows={3}
          />

          <label className="text-sm font-medium dark:text-gray-300">
            Department *
          </label>
          <label className="text-sm font-medium dark:text-gray-300">
            Assign Employees *
          </label>

          <Select
            options={departments.map((d) => ({ value: d, label: d }))}
            value={selectedDept}
            onChange={(opt) => setSelectedDept(opt as OptionType | null)}
            placeholder="Select department"
            styles={customSelectStyles}
            instanceId="department-select" // ✅ Added instanceId
          />

          <Select
            isMulti
            options={employeeOptions}
            value={selectedEmployees}
            onChange={(val) =>
              setSelectedEmployees(val as readonly OptionType[])
            }
            placeholder="Select employees from department"
            styles={customSelectStyles}
            instanceId="employee-select" // ✅ Added instanceId
          />

          <button
            onClick={createProject}
            disabled={loading}
            className="bg-blue-600 text-white py-2 px-4 rounded md:col-span-2 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {loading ? "Saving..." : "➕ Create Project"}
          </button>
        </div>

        {/* 📋 Export & List Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            📦 Existing Projects
          </h2>
          <CSVExportButton data={projects} filename="projects.csv" />
        </div>

        {/* 📁 Projects Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-5 border bg-white rounded-lg shadow hover:shadow-md transition dark:bg-gray-800 dark:border-gray-700 dark:shadow-none"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                {proj.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <FaCalendarAlt /> {new Date(proj.deadline).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 mb-1">
                {proj.description}
              </p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${deptColor(
                  proj.department
                )}`}
              >
                {proj.department}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 flex items-center gap-2">
                <FaUsers /> {proj.assignedNames?.join(", ") || "—"}
              </p>

              <div className="mt-2">
                <select
                  value={proj.status}
                  onChange={(e) => updateStatus(proj.id, e.target.value)}
                  className="text-sm border p-1 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
                <span
                  className={`ml-2 font-semibold ${statusColor(proj.status)}`}
                >
                  {proj.status}
                </span>
              </div>

              {proj.logs?.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
                    📊 Status History
                  </h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-300 mt-1 space-y-1">
                    {proj.logs.map((log, idx) => (
                      <li key={idx}>
                        {log.timestamp.split("T")[0]} — {log.status}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => deleteProject(proj.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 flex items-center gap-1 dark:bg-red-600 dark:hover:bg-red-700"
                >
                  <FaTrash /> Delete
                </button>
                <button
                  disabled
                  className="bg-gray-400 text-white px-3 py-1 rounded text-sm cursor-not-allowed dark:bg-gray-600"
                >
                  ✉ Notify
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
