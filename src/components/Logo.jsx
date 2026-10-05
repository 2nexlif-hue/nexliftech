export default function LogoSVG({ className = "navbar-logo-svg", size = 32 }) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="NexLifTech NLT Monogram Logo"
    >
      <defs>
        <linearGradient id="nlt-brand-grad" x1="18" y1="20" x2="86" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>

      {/* Combined N-L-T Modern Minimalist Monogram */}
      {/* N: Left vertical, Diagonal to center, Upright to top */}
      <path 
        d="M 22 76 L 22 24 L 56 76 L 56 24" 
        stroke="url(#nlt-brand-grad)" 
        strokeWidth="8.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* T: Top horizontal crossbar */}
      <path 
        d="M 38 24 L 84 24" 
        stroke="url(#nlt-brand-grad)" 
        strokeWidth="8.5" 
        strokeLinecap="round" 
      />

      {/* L: Bottom horizontal foot base */}
      <path 
        d="M 56 76 L 84 76" 
        stroke="url(#nlt-brand-grad)" 
        strokeWidth="8.5" 
        strokeLinecap="round" 
      />
    </svg>
  );
}
