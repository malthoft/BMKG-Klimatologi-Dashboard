import React from 'react';

export const InstagramIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <defs>
      <radialGradient id="ig-grad" r="1.5" cx="0.2" cy="1" >
        <stop offset="0" stopColor="#fdf497" />
        <stop offset="0.05" stopColor="#fdf497" />
        <stop offset="0.45" stopColor="#fd5949" />
        <stop offset="0.6" stopColor="#d6249f" />
        <stop offset="0.9" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" fill="url(#ig-grad)" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" stroke="white" strokeWidth="2" />
  </svg>
);
