import { HTMLAttributes, ReactNode } from "react";

interface TypographyProps extends HTMLAttributes<HTMLHeadingElement | HTMLParagraphElement | HTMLSpanElement> {
  children: ReactNode;
  className?: string;
}

export function H1({ children, className = "", ...props }: TypographyProps) {
  return (
    <h1
      className={`text-[3rem] font-bold leading-[1.1] tracking-[-0.02em] ${className}`}
      {...props}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className = "", ...props }: TypographyProps) {
  return (
    <h2
      className={`text-[1.5rem] font-semibold leading-[1.3] ${className}`}
      {...props}
    >
      {children}
    </h2>
  );
}

export function Body({ children, className = "", ...props }: TypographyProps) {
  return (
    <p
      className={`text-[1rem] font-normal leading-[1.6] ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export function Label({ children, className = "", ...props }: TypographyProps) {
  return (
    <span
      className={`text-[0.875rem] font-medium ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
