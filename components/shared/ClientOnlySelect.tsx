// components/shared/ClientOnlySelect.tsx
"use client";

import { useEffect, useState } from "react";
import Select, { Props as SelectProps } from "react-select";

export default function ClientOnlySelect<T>(props: SelectProps<T>) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => setHasMounted(true), []);

  if (!hasMounted) return null;

  return <Select {...props} />;
}
