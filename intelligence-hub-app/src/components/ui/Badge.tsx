import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "active" | "linkedin" | "x" | "tiktok" | "blog" | "draft" | "review" | "approved" | "published";
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-horse-gray-100 text-horse-gray-500",
  active: "bg-horse-black text-white",
  linkedin: "bg-[rgba(10,102,194,0.08)] text-platform-linkedin",
  x: "bg-[rgba(0,0,0,0.05)] text-platform-x",
  tiktok: "bg-[rgba(193,53,132,0.08)] text-platform-tiktok",
  blog: "bg-[rgba(42,157,92,0.08)] text-platform-blog",
  draft: "bg-[rgba(212,160,23,0.1)] text-status-draft",
  review: "bg-[rgba(45,108,206,0.1)] text-status-review",
  approved: "bg-[rgba(42,157,92,0.1)] text-status-approved",
  published: "bg-horse-gray-100 text-horse-black",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
