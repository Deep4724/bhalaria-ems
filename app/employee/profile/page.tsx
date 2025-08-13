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
          const docData = snapshot.docs[0].data();
          setDocId(snapshot.docs[0].id);
          setProfile({
            fullName: docData.fullName || "",
            email: docData.email || user.email || "",
            phone: docData.phone || "",
            address: docData.address || "",
            bio: docData.bio || "",
            photoURL: docData.photoURL || "",
          });
        } else {
          setProfile((prev) => ({ ...prev, email: user.email || "" }));
        }
      } catch (error) {
        toast.error("\u274C Failed to fetch profile.");
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

    if (file.size / 1024 / 1024 > 2) {
      toast.error("\u274C Image size exceeds 2MB limit.");
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
          `\u274C Upload failed: ${err.error?.message || "Unknown error"}`
        );
        return null;
      }

      const data = await res.json();
      return data.secure_url;
    } catch {
      toast.error("\u274C Network or upload error.");
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
      toast.success("\u2705 Profile photo updated!");
    } catch {
      toast.error("\u274C Failed to save image.");
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
      toast.success("\u2705 Profile saved.");
    } catch (error) {
      toast.error("\u274C Failed to save profile.");
      console.error(error);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        My Profile
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-5 max-w-xl bg-white dark:bg-gray-800 p-6 shadow rounded"
      >
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24">
            <ProfileImage
              src={previewURL || profile.photoURL}
              alt="Profile"
              size={96}
              className="border rounded-full"
            />
            <label
              htmlFor="profile-image"
              className="absolute bottom-0 w-full text-sm text-white text-center bg-black bg-opacity-50 py-1 cursor-pointer hover:bg-opacity-70"
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
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Upload JPG/PNG under 2MB.
          </p>
        </div>

        {showConfirm && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmUpload}
              className="bg-green-600 text-white px-4 py-1 rounded"
            >
              \u2705 Confirm Image
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedImage(null);
                setPreviewURL(null);
                setShowConfirm(false);
              }}
              className="bg-gray-300 px-4 py-1 rounded"
            >
              \u274C Cancel
            </button>
          </div>
        )}

        <input
          type="text"
          name="fullName"
          value={profile.fullName}
          onChange={handleChange}
          placeholder="Full Name"
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />

        <input
          type="email"
          value={profile.email}
          disabled
          className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
        />

        <input
          type="tel"
          name="phone"
          value={profile.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />

        <input
          type="text"
          name="address"
          value={profile.address}
          onChange={handleChange}
          placeholder="Address"
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />

        <textarea
          name="bio"
          value={profile.bio}
          onChange={handleChange}
          placeholder="Bio"
          rows={3}
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
}
