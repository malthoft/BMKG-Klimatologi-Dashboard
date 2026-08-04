"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface CardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <motion.div
      whileHover={{
        y: -3,
        boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.04)",
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`bg-surface p-[24px] rounded-xl border border-border/70 shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
