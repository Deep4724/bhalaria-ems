// ✅ File: app/admin/settings/security/page.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function SecuritySettingsPage() {
  const [recaptchaEnabled, setRecaptchaEnabled] = useState(false);
  const [emailJsEnabled, setEmailJsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const ref = doc(db, "settings", "security");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setRecaptchaEnabled(!!data.recaptcha);
        setEmailJsEnabled(!!data.emailJs);
      }
      setLoading(false);
    };
    loadSettings();
  }, []);

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "security"), {
        recaptcha: recaptchaEnabled,
        emailJs: emailJsEnabled,
      });
      toast.success("Security settings updated");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold mb-4">🛡️ Security Settings</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="max-w-lg bg-white dark:bg-gray-800 p-6 rounded shadow space-y-6">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Enable reCAPTCHA</label>
            <input
              type="checkbox"
              checked={recaptchaEnabled}
              onChange={(e) => setRecaptchaEnabled(e.target.checked)}
              className="h-4 w-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Enable EmailJS Reset Option
            </label>
            <input
              type="checkbox"
              checked={emailJsEnabled}
              onChange={(e) => setEmailJsEnabled(e.target.checked)}
              className="h-4 w-4"
            />
          </div>

          <button
            onClick={saveSettings}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
}
