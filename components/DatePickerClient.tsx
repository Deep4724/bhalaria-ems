"use client";

import dynamic from "next/dynamic";
import "react-datepicker/dist/react-datepicker.css";

// Minimal loose prop type, no `any`!
type LooseProps = Record<string, unknown>;

// No generics, no `any`—just accept all props
const DatePicker = dynamic(
  () => import("react-datepicker") as unknown as Promise<React.FC<LooseProps>>,
  {
    ssr: false,
    loading: () => <p>Loading...</p>,
  }
);

export default DatePicker;
