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
        y: -2,
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`bg-surface p-[24px] rounded-md border border-border shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
