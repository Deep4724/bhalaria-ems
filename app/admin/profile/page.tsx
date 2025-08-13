"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  query,
  where,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import ProfileImage from "@/components/ProfileImage";
import toast, { Toaster } from "react-hot-toast";

export default function ProfilePage() {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
    photoURL: "",
  });
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "employees"),
          where("uid", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const firstDoc = snapshot.docs[0];
          const data = firstDoc.data();
          setDocId(firstDoc.id);
          setProfile({
            fullName: data.fullName || "",
            email: data.email || user.email || "",
            phone: data.phone || "",
            address: data.address || "",
            bio: data.bio || "",
            photoURL: data.photoURL || "",
          });
          if (snapshot.docs.length > 1) {
            for (let i = 1; i < snapshot.docs.length; i++) {
              await deleteDoc(snapshot.docs[i].ref);
              console.warn(
                "⚠️ Duplicate employee profile deleted:",
                snapshot.docs[i].id
              );
            }
          }
        } else {
          setProfile((prev) => ({ ...prev, email: user.email || "" }));
        }
      } catch (error) {
        toast.error("❌ Failed to fetch profile.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    //Image size
    if (file.size / 1024 / 1024 > 2) {
      toast.error("❌ Image size exceeds 2MB limit.");
      return;
    }
    setSelectedImage(file);
    setPreviewURL(URL.createObjectURL(file));
    setShowConfirm(true);
  };

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "employee_uploads");
    formData.append("folder", "employee-profiles");
    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dde6xfvon/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      if (!res.ok) {
        const err = await res.json();
        toast.error(
          `❌ Upload failed: ${err.error?.message || "Unknown error"}`
        );
        return null;
      }
      const data = await res.json();
      return data.secure_url;
    } catch {
      toast.error("❌ Network or upload error.");
      return null;
    }
  };

  const confirmUpload = async () => {
    if (!user || !selectedImage) return;
    const url = await uploadToCloudinary(selectedImage);
    if (!url) return;
    const updated = { ...profile, photoURL: url };
    try {
      if (docId) {
        await updateDoc(doc(db, "employees", docId), updated);
      } else {
        const newDoc = await addDoc(collection(db, "employees"), {
          ...updated,
          uid: user.uid,
          email: user.email || "",
        });
        setDocId(newDoc.id);
      }
      setProfile(updated);
      setShowConfirm(false);
      setSelectedImage(null);
      setPreviewURL(null);
      toast.success("✅ Profile photo updated!");
    } catch {
      toast.error("❌ Failed to save image.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (docId) {
        await updateDoc(doc(db, "employees", docId), profile);
      } else {
        const newDoc = await addDoc(collection(db, "employees"), {
          ...profile,
          uid: user.uid,
          email: user.email || "",
        });
        setDocId(newDoc.id);
      }
      toast.success("✅ Profile saved.");
    } catch (error) {
      toast.error("❌ Failed to save profile.");
      console.error(error);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-blue-700 dark:text-blue-400">
        My Profile
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-md rounded-xl"
      >
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-24 h-24">
            <ProfileImage
              src={previewURL || profile.photoURL}
              alt="Profile"
              size={96}
              className="border rounded-full object-cover"
            />
            <label
              htmlFor="profile-image"
              className="absolute bottom-0 w-full text-xs sm:text-sm text-white text-center bg-black bg-opacity-60 py-1 cursor-pointer hover:bg-opacity-80 rounded-b"
            >
              Change
            </label>
            <input
              id="profile-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Upload JPG/PNG under 2MB.
          </p>
        </div>

        {showConfirm && (
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={confirmUpload}
              className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
            >
              ✅ Confirm Image
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setPreviewURL(null);
                setShowConfirm(false);
              }}
              className="bg-gray-300 dark:bg-gray-600 text-black dark:text-white px-4 py-1 rounded hover:bg-gray-400 dark:hover:bg-gray-700"
            >
              ❌ Cancel
            </button>
          </div>
        )}

        <input
          type="text"
          name="fullName"
          value={profile.fullName}
          onChange={handleChange}
          placeholder="Full Name"
          className="w-full p-3 border rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />

        <input
          type="email"
          value={profile.email}
          disabled
          className="w-full p-3 border rounded-md shadow-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
        />

        <input
          type="tel"
          name="phone"
          value={profile.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="w-full p-3 border rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />

        <input
          type="text"
          name="address"
          value={profile.address}
          onChange={handleChange}
          placeholder="Address"
          className="w-full p-3 border rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />

        <textarea
          name="bio"
          value={profile.bio}
          onChange={handleChange}
          placeholder="Bio"
          rows={3}
          className="w-full p-3 border rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 w-full sm:w-auto"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
}
