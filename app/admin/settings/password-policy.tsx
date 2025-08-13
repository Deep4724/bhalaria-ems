// ✅ File: app/admin/settings/password-policy.tsx
"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function PasswordPolicyPage() {
  const [enforced, setEnforced] = useState(false);
  const [historyCount, setHistoryCount] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      const ref = doc(db, "settings", "password-policy");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setEnforced(Boolean(data.enforce));
        setHistoryCount(Number(data.historyCount));
      }
      setLoading(false);
    };
    fetchPolicy();
  }, []);

  const savePolicy = async () => {
    try {
      await setDoc(doc(db, "settings", "password-policy"), {
        enforce: enforced,
        historyCount,
      });
      toast.success("Policy updated");
    } catch {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold mb-4">🔐 Password Policy Settings</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="max-w-md bg-white dark:bg-gray-800 rounded shadow p-6 space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enforced}
              onChange={(e) => setEnforced(e.target.checked)}
              className="h-4 w-4"
            />
            <span>Enforce password history policy</span>
          </label>

          <label className="block">
            <span className="block text-sm mb-1">Prevent reuse of last:</span>
            <input
              type="number"
              min={1}
              max={10}
              value={historyCount}
              onChange={(e) => setHistoryCount(Number(e.target.value))}
              className="w-full border p-2 rounded dark:bg-gray-700"
              disabled={!enforced}
            />
          </label>

          <button
            onClick={savePolicy}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Save Policy
          </button>
        </div>
      )}
    </div>
  );
}
