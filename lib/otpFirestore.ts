"use client";
import { db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";

const OTP_COLLECTION = "otp-verification";

// ✅ Save OTP to Firestore with expiration
export const saveOTP = async (email: string, otp: string): Promise<void> => {
  const docRef = doc(db, OTP_COLLECTION, email);
  await setDoc(docRef, {
    otp,
    createdAt: Timestamp.now(),
  });
};

// ✅ Verify OTP — returns true if valid and not expired (5 min)
export const verifyOTP = async (
  email: string,
  inputOtp: string
): Promise<boolean> => {
  const docRef = doc(db, OTP_COLLECTION, email);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return false;

  const data = snapshot.data() as {
    otp: string;
    createdAt: Timestamp;
  };

  const now = Timestamp.now();
  const created = data.createdAt;
  const diffInSeconds = now.seconds - created.seconds;

  const isValid = data.otp === inputOtp && diffInSeconds <= 300;

  // ✅ Clean up used OTP
  if (isValid) await deleteDoc(docRef);

  return isValid;
};

// ✅ Admin alert or cleanup after 3 failed attempts (optional)
export const deleteOTP = async (email: string): Promise<void> => {
  const docRef = doc(db, OTP_COLLECTION, email);
  await deleteDoc(docRef);
};
