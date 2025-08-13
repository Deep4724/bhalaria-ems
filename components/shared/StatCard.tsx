// components/shared/StatCard.tsx
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: number;
  icon?: string;
  bg?: string;
  href?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  bg,
  href,
}: StatCardProps) {
  const content = (
    <div
      className={`p-4 rounded-xl shadow hover:shadow-md transition ${
        bg || "bg-white"
      } cursor-pointer`}
    >
      {icon && <div className="text-3xl mb-2">{icon}</div>}
      <div className="text-gray-500 text-sm font-semibold">{title}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
