import { ReactNode } from "react";
import { Label } from "./typography";

interface BadgeProps {
  children: ReactNode;
  variant?: "neutral" | "success" | "warning" | "error";
  className?: string;
}

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  const baseStyles = "px-[12px] py-[4px] rounded-full inline-flex items-center justify-center";
  
  const variants = {
    neutral: "bg-tertiary text-primary",
    success: "bg-[#D1FAE5] text-[#065F46]", // using explicit colors for good contrast
    warning: "bg-[#FEF3C7] text-[#92400E]",
    error: "bg-[#FEE2E2] text-[#991B1B]",
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`}>
      <Label>{children}</Label>
    </div>
  );
}
