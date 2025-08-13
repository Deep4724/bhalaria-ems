"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { FaUsers, FaBriefcase, FaFileAlt, FaInbox } from "react-icons/fa";

export default function DashboardPage() {
  const [employees, setEmployees] = useState(0);
  const [jobs, setJobs] = useState(0);
  const [policies, setPolicies] = useState(0);
  const [applications, setApplications] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empSnap = await getDocs(collection(db, "employees"));
        const jobSnap = await getDocs(collection(db, "jobs"));
        const policySnap = await getDocs(collection(db, "policies"));
        const applicationSnap = await getDocs(collection(db, "applications"));

        setEmployees(empSnap.size);
        setJobs(
          jobSnap.docs.filter((doc) => doc.data().status === "Open").length
        );
        setPolicies(policySnap.size);
        setApplications(applicationSnap.size);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  const summaryCards = [
    {
      title: "Employees",
      value: employees,
      description: "Total active employees in the system.",
      icon: (
        <FaUsers className="text-[#2563EB] text-4xl group-hover:scale-110 transition-transform" />
      ),
      bg: "bg-[#DBEAFE] dark:bg-[#1E3A8A]/30", // ✅ Blue light & dark
      link: "/hr/employees",
    },
    {
      title: "Open Jobs",
      value: jobs,
      description: "Available positions open for applications.",
      icon: (
        <FaBriefcase className="text-[#10B981] text-4xl group-hover:scale-110 transition-transform" />
      ),
      bg: "bg-[#D1FAE5] dark:bg-[#064E3B]/30", // ✅ Green light & dark
      link: "/hr/jobs",
    },
    {
      title: "Policies",
      value: policies,
      description: "Uploaded company policies viewable by all employees.",
      icon: (
        <FaFileAlt className="text-[#F59E0B] text-4xl group-hover:scale-110 transition-transform" />
      ),
      bg: "bg-[#FEF3C7] dark:bg-[#78350F]/30", // ✅ Yellow light & dark
      link: "/hr/policies",
    },
    {
      title: "Total Applications",
      value: applications,
      description: "Job applications submitted by employees.",
      icon: (
        <FaInbox className="text-[#EC4899] text-4xl group-hover:scale-110 transition-transform" />
      ),
      bg: "bg-[#FCE7F3] dark:bg-[#831843]/30", // ✅ Pink light & dark
      link: "/hr/jobapplications",
    },
  ];

  return (
    // ✅ Main background updated for dark mode
    <div className="flex min-h-screen overflow-hidden bg-[#F3F4F6] dark:bg-[#0f172a] font-sans text-gray-900 dark:text-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-6 h-full overflow-y-auto">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 flex items-center gap-2">
            📊 HR Dashboard Overview
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {summaryCards.map((card, index) => (
              <div
                key={index}
                onClick={() => router.push(card.link)}
                className={`${card.bg} group hover:brightness-95 transition-all duration-300 p-6 rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700 cursor-pointer`}
              >
                <div className="flex items-center gap-4 mb-4">
                  {card.icon}
                  <div>
                    <p className="text-md text-gray-600 dark:text-gray-400">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {card.value}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
