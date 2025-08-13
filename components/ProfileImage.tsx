"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProfileImage({
  src,
  alt = "User profile photo",
  size = 40,
  className = "",
}: {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
}) {
  const [error, setError] = useState(false);

  return (
    <Image
      src={!error && src ? src : "/default-avatar.png"}
      alt={alt}
      width={size}
      height={size}
      onError={() => setError(true)}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size, objectFit: "cover" }}
    />
  );
}
