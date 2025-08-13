// FILE: app/hr/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { HiArrowLeft, HiCamera } from "react-icons/hi";
import Image from "next/image";

type UserProfile = {
  name: string;
  phone: string;
  email: string;
  photoURL?: string;
  department?: string;
  role?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  gender?: string;
  dob?: string;
};

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [docId, setDocId] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState<UserProfile>({
    name: "",
    phone: "",
    email: "",
    photoURL: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    gender: "",
    dob: "",
    department: "",
    role: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const q = query(
          collection(db, "employees"),
          where("email", "==", user.email)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docRef = snapshot.docs[0];
          const data = docRef.data() as UserProfile;
          setUserData(data);
          setForm({
            name: data.name || "",
            phone: data.phone || "",
            email: data.email || "",
            photoURL: data.photoURL || "",
            address: data.address || "",
            city: data.city || "",
            postalCode: data.postalCode || "",
            country: data.country || "",
            gender: data.gender || "",
            dob: data.dob || "",
            department: data.department || "",
            role: data.role || "",
          });
          setPhotoPreview(data.photoURL || "");
          setDocId(docRef.id);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: "Image must be less than 2MB" }));
      toast.error("Image too large. Max size is 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setForm((prev) => ({ ...prev, photoURL: base64 }));
      setPhotoPreview(base64);
      setErrors((prev) => ({ ...prev, photo: "" }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    let valid = true;
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }

    const phoneRegex = /^\+91[-\s]?([6-9]\d{4})[-\s]?(\d{5})$/;
    if (!form.phone.trim()) {
      newErrors.phone = "Phone is required";
      valid = false;
    } else if (!phoneRegex.test(form.phone)) {
      newErrors.phone = "Invalid Indian phone format (+91 XXXXX XXXXX)";
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = "Invalid email format";
      valid = false;
    }

    if (!form.address?.trim()) {
      newErrors.address = "Address is required";
      valid = false;
    }

    if (!form.city?.trim()) {
      newErrors.city = "City is required";
      valid = false;
    }

    if (!form.postalCode?.trim()) {
      newErrors.postalCode = "Postal Code is required";
      valid = false;
    }

    if (!form.country?.trim()) {
      newErrors.country = "Country is required";
      valid = false;
    }

    if (!form.dob?.trim()) {
      newErrors.dob = "Date of Birth is required";
      valid = false;
    }

    if (!form.gender?.trim()) {
      newErrors.gender = "Gender is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      const ref = doc(db, "employees", docId);
      await updateDoc(ref, { ...form });
      setUserData({ ...userData!, ...form });
      setEditMode(false);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Error updating profile.");
    }
  };

  if (loading) return <div className="p-6 dark:text-white">Loading...</div>;
  if (!userData)
    return (
      <div className="p-6 text-red-600 dark:text-red-400 font-bold">
        User not found.
      </div>
    );

  return (
    <div className="p-8 max-w-5xl mx-auto dark:bg-gray-900 dark:text-white transition-colors">
      <button
        onClick={() => router.back()}
        className="flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6"
      >
        <HiArrowLeft className="mr-1" />
        Back
      </button>

      <h1 className="text-4xl font-bold text-blue-900 dark:text-blue-400 mb-6">
        My Profile
      </h1>

      {/* Dark overlay for image preview */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-lg relative max-w-sm w-full">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black dark:text-gray-300 dark:hover:text-white"
            >
              ✕
            </button>
            <Image
              src={photoPreview || "/default-avatar.png"}
              alt="Preview"
              width={400}
              height={400}
              className="rounded-xl object-cover mx-auto"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-xl rounded-xl p-8 border transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Image
              src={photoPreview || "/default-avatar.png"}
              alt="Profile"
              width={128}
              height={128}
              className="rounded-full object-cover border shadow cursor-pointer"
              onClick={() => setShowPreview(true)}
            />
            {editMode && (
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer">
                <HiCamera />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {errors.photo && (
            <p className="text-sm text-red-500">{errors.photo}</p>
          )}
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            {userData?.role?.toUpperCase()}
          </p>
        </div>

        <div className="flex-1 space-y-5">
          {[
            "name",
            "email",
            "phone",
            "address",
            "city",
            "postalCode",
            "country",
          ].map((field) => (
            <div key={field}>
              <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1 capitalize">
                {field.replace(/([A-Z])/g, " $1")}
              </label>
              {editMode ? (
                <>
                  <input
                    name={field}
                    value={form[field as keyof typeof form] || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                  {errors[field] && (
                    <p className="text-sm text-red-500 mt-1">{errors[field]}</p>
                  )}
                </>
              ) : (
                <p className="text-lg">
                  {userData?.[field as keyof UserProfile]}
                </p>
              )}
            </div>
          ))}

          <div>
            <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Date of Birth
            </label>
            {editMode ? (
              <>
                <input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                {errors.dob && (
                  <p className="text-sm text-red-500 mt-1">{errors.dob}</p>
                )}
              </>
            ) : (
              <p className="text-lg">{userData?.dob}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Gender
            </label>
            {editMode ? (
              <>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="I prefer not to say">
                    I prefer not to say
                  </option>
                </select>
                {errors.gender && (
                  <p className="text-sm text-red-500 mt-1">{errors.gender}</p>
                )}
              </>
            ) : (
              <p className="text-lg">{userData?.gender}</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">
              Department
            </label>
            <p className="text-lg">{userData?.department}</p>
          </div>

          <div className="pt-4">
            {editMode ? (
              <div className="flex gap-4">
                <button
                  onClick={handleUpdate}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
