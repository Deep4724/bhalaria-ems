// components/shared/TimePicker.tsx
import React from "react";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TimePicker({
  value,
  onChange,
  placeholder,
}: TimePickerProps) {
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="border px-3 py-2 rounded w-full dark:bg-gray-800 dark:text-white text-sm"
    />
  );
}
