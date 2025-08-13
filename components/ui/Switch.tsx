"use client";

import * as Toggle from "@radix-ui/react-switch";
import { twMerge } from "tailwind-merge";

interface SwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}

export default function Switch({ checked, onChange, className }: SwitchProps) {
  return (
    <Toggle.Root
      className={twMerge(
        "w-10 h-6 rounded-full bg-gray-300 data-[state=checked]:bg-blue-600 relative transition-colors",
        className
      )}
      checked={checked}
      onCheckedChange={onChange}
    >
      <Toggle.Thumb className="block w-4 h-4 bg-white rounded-full shadow transition-transform translate-x-1 data-[state=checked]:translate-x-5" />
    </Toggle.Root>
  );
}
