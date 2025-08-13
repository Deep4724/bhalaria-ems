// app/hr/layout.tsx
import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "HR Section | Bhalaria Works",
  description: "HR features for the Bhalaria Workforce Dashboard",
};

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div
        className={`${poppins.className} bg-[#F3F4F6] text-gray-900 font-sans antialiased min-h-screen`}
      >
        {children}
      </div>
    </AuthProvider>
  );
}
