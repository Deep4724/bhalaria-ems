import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = "default",
}) => {
  const base = "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded";
  const variants = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-purple-100 text-purple-800",
  };

  return (
    <span className={cn(base, variants[variant], className)}>
      {children}
    </span>
  );
};
