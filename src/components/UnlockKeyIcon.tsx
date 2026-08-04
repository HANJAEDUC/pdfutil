import React from 'react';

interface UnlockKeyIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function UnlockKeyIcon({ size = 24, className = '', style = {} }: UnlockKeyIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      {/* Open Lock Shackle */}
      <path d="M6.5 10.5V6.5a3.5 3.5 0 0 1 6.5-1.8" />

      {/* Lock Body */}
      <rect x="3.5" y="10.5" width="9" height="9.5" rx="2" />

      {/* Key Ring & Shaft */}
      <circle cx="19" cy="12" r="2.2" />
      <path d="M17 13.5l-4.5 4.5" />
      <path d="M14.2 16.3l1.2 1.2" />
      <path d="M12.8 17.7l1.2 1.2" />
    </svg>
  );
}
