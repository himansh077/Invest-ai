export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 250 80" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* The letter 'i' tucked under the peak */}
      <rect x="42" y="38" width="8" height="22" fill="currentColor" />
      <circle cx="46" cy="28" r="4" fill="currentColor" />

      {/* The Chart Line forming the 'V' and peaking over 'i' */}
      <path 
        d="M 10 60 L 46 15 L 70 55 L 120 15" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
      {/* Arrowhead */}
      <polygon points="110,12 128,5 120,23" fill="currentColor" />

      {/* The letter 'E' (3 horizontal bars) */}
      <path d="M 135 25 L 165 25 M 135 42 L 160 42 M 135 60 L 165 60" stroke="currentColor" strokeWidth="6" />

      {/* The letter 'S' */}
      <text x="175" y="62" fill="currentColor" fontSize="48" fontFamily="sans-serif" fontWeight="bold">S</text>

      {/* The letter 'T' */}
      <text x="215" y="62" fill="currentColor" fontSize="48" fontFamily="sans-serif" fontWeight="bold">T</text>
    </svg>
  );
}
