"use client";

import { useState, useEffect } from "react";
import {
  FaHeartbeat,
  FaTooth,
  FaAmbulance,
  FaBrain,
  FaShieldAlt,
  FaRunning,
} from "react-icons/fa";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

const benefitData = [
  {
    title: "Annual Health Checkups",
    icon: (
      <FaHeartbeat className="text-3xl text-green-600 dark:text-green-400" />
    ),
    description:
      "Comprehensive yearly health checkups for employees and their dependents.",
    details:
      "Includes blood tests, BMI, ECG, liver & kidney function tests, and follow-up consultation. 100% covered.",
  },
  {
    title: "Dental & Vision Plans",
    icon: <FaTooth className="text-3xl text-green-600 dark:text-green-400" />,
    description: "Covers dental cleanings, fillings, and annual vision exams.",
    details:
      "Employees can claim dental work up to $500/year and free eyeglasses every 2 years.",
  },
  {
    title: "Emergency Coverage",
    icon: (
      <FaAmbulance className="text-3xl text-green-600 dark:text-green-400" />
    ),
    description:
      "24/7 emergency care, ambulance, and hospitalization coverage.",
    details:
      "Covers emergency room visits, ICU stays, ambulance rides, and emergency hospitalization.",
  },
  {
    title: "Mental Health Support",
    icon: <FaBrain className="text-3xl text-green-600 dark:text-green-400" />,
    description: "Confidential therapy and counseling sessions.",
    details:
      "Unlimited virtual sessions + 6 in-person counseling visits/year for employees and family members.",
  },
  {
    title: "Wellness & Fitness",
    icon: <FaRunning className="text-3xl text-green-600 dark:text-green-400" />,
    description: "Reimbursement for gym and wellness programs.",
    details:
      "Claim up to $300/year for gym, yoga, meditation, or virtual fitness memberships.",
  },
  {
    title: "Insurance Protection",
    icon: (
      <FaShieldAlt className="text-3xl text-green-600 dark:text-green-400" />
    ),
    description: "Life insurance and accidental injury coverage.",
    details: "Covers $100K per employee with optional spouse & family add-ons.",
  },
];

export default function BenefitsPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (user) {
      console.log("Benefits accessed by:", user.email);
    }
  }, [user]);

  return (
    <div className="p-6 sm:p-8 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-green-600 dark:text-green-400 mb-8 text-center">
        🏥 Bhalaria Health Benefits
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefitData.map((benefit, i) => (
          <div
            key={i}
            onClick={() => setActiveIndex(i)}
            className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md hover:shadow-lg hover:ring-2 hover:ring-green-400 transition duration-200"
          >
            <div className="mb-3">{benefit.icon}</div>
            <h2 className="text-lg font-semibold text-green-700 dark:text-green-300">
              {benefit.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>

      {/* 📌 Modal Section */}
      {activeIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white max-w-md w-full p-6 rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
              {benefitData[activeIndex].title}
            </h2>
            <p className="text-sm">{benefitData[activeIndex].details}</p>
            <button
              className="mt-6 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              onClick={() => setActiveIndex(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
