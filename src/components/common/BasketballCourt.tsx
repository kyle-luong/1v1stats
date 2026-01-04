// src/components/BasketballCourt.tsx
// Reusable NBA half-court SVG background component

interface BasketballCourtProps {
  className?: string;
}

/**
 * NBA half-court SVG component with accurate proportions.
 * Used as a decorative background element in the hero section.
 */
export function BasketballCourt({ className = "" }: BasketballCourtProps) {
  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      preserveAspectRatio="xMidYMin meet"
      aria-hidden="true"
    >
      {/* Half court - arc peak at y~20, baseline at y=490 (off screen) */}

      {/* Three-point line: arc endpoints at y=240 so peak is around y=15 */}
      <path d="M 25 240 A 225 225 0 0 1 475 240" />
      {/* Left corner straight section */}
      <line x1="25" y1="240" x2="25" y2="490" />
      {/* Right corner straight section */}
      <line x1="475" y1="240" x2="475" y2="490" />

      {/* The key/paint area */}
      <rect x="175" y="230" width="150" height="260" />

      {/* Free throw circle (top half solid - outside the key) */}
      <path d="M 175 230 A 75 75 0 0 1 325 230" />
      {/* Free throw circle (bottom half dashed - inside the key) */}
      <path d="M 175 230 A 75 75 0 0 0 325 230" strokeDasharray="10 7" />

      {/* Restricted area arc */}
      <path d="M 212 490 A 38 38 0 0 1 288 490" />

      {/* Rim and backboard */}
      <circle cx="250" cy="455" r="10" />
      <line x1="230" y1="470" x2="270" y2="470" strokeWidth="3" />

      {/* Small rectangle connecting rim to backboard */}
      <rect x="247" y="455" width="6" height="15" />

      {/* Lane block markers */}
      <line x1="175" y1="300" x2="160" y2="300" />
      <line x1="175" y1="360" x2="160" y2="360" />
      <line x1="175" y1="420" x2="160" y2="420" />
      <line x1="325" y1="300" x2="340" y2="300" />
      <line x1="325" y1="360" x2="340" y2="360" />
      <line x1="325" y1="420" x2="340" y2="420" />

      {/* Baseline - below visible area */}
      <line x1="0" y1="490" x2="500" y2="490" />
    </svg>
  );
}
