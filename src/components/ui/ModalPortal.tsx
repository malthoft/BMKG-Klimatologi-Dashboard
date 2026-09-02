"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent scrolling on body when modal is open
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
