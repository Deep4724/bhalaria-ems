// ✅ CSVExportButton.tsx
"use client"; // Enables client-side rendering for Next.js

import dynamic from "next/dynamic"; // Used for lazy loading components
import { useEffect, useState } from "react";

// ⏬ Dynamically import CSVLink from react-csv (since it uses `window`, which breaks SSR)
const CSVLink = dynamic(() => import("react-csv").then((mod) => mod.CSVLink), {
  ssr: false, // ❌ Disable server-side rendering for this component
});

// 🧾 Props for CSVExportButton — accepts any object array and optional filename
interface CSVExportButtonProps<T extends object> {
  data: T[]; // 📦 Data to be exported
  filename?: string; // 📝 Optional export file name (defaults to "export.csv")
}

// 📤 Reusable CSV export button component
export default function CSVExportButton<T extends object>({
  data,
  filename = "export.csv", // 🧾 Default file name
}: CSVExportButtonProps<T>) {
  // ✅ State to ensure dynamic import has loaded (required before rendering CSVLink)
  const [ready, setReady] = useState(false);

  // ⏳ Wait until component mounts on client side
  useEffect(() => {
    setReady(true);
  }, []);

  // ⛔ Don't render anything on server or before hydration completes
  if (!ready) return null;

  // ✅ Render CSV export button once CSVLink is loaded
  return (
    <CSVLink
      data={data} // 📦 Data to export
      filename={filename} // 📝 File name to save as
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
    >
      Export CSV
    </CSVLink>
  );
}
