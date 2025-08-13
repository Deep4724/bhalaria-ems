// app/verify/page.tsx
"use client";

export default function VerifyPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-3xl font-bold text-red-600">Verification Needed</h1>
      <p className="mt-4 text-gray-700">
        Too many failed login attempts. For reset your password contact Admin
        department at CD302 building.
      </p>
    </div>
  );
}
