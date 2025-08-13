import "@/app/globals.css";
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Bhalaria Works",
  description: "Workforce Management System for Bhalaria Utensils",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ✅ reCAPTCHA site key */}
        <Script
          src="https://www.google.com/recaptcha/api.js?render=6LeVOZYrAAAAAC-0DzFpUPmNxEDsC1WOlKvBhYPF"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${inter.className} bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white`}
      >
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontSize: "0.875rem",
              padding: "12px 16px",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
