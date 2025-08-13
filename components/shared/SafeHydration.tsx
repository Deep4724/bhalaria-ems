"use client";

// ✅ SafeHydration wrapper to prevent hydration mismatch
import { useEffect, useState } from "react";

interface SafeHydrationProps {
  children: React.ReactNode;
}

export default function SafeHydration({ children }: SafeHydrationProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // ✅ Trigger only on client side
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // ❌ Avoid SSR mismatch — wait until after hydration
    return null;
  }

  return <>{children}</>;
}
