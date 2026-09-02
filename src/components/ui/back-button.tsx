"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface BackButtonProps {
  fallbackHref?: string;
  label?: string;
  className?: string;
  children?: ReactNode;
}

export function BackButton({
  fallbackHref,
  label = "Kembali",
  className = "inline-flex items-center gap-1.5 text-primary hover:text-blue-700 font-bold mb-6 transition-colors cursor-pointer bg-transparent border-0 p-0 text-sm",
  children,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined") {
      // Periksa apakah user berasal dari halaman lain di domain yang sama
      const isInternalReferrer = document.referrer.includes(window.location.origin);
      
      if (isInternalReferrer && window.history.length > 1) {
        window.history.back();
      } else if (fallbackHref) {
        router.push(fallbackHref);
      } else {
        router.push("/");
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={className}
      title="Kembali ke halaman sebelumnya"
    >
      {children || (
        <>
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
