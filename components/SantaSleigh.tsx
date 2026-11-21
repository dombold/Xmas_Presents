// Decorative Santa in his sleigh, pulled by two reindeer, flying beside the countdown.
// Motion is transform/opacity only (see .santa-* in globals.css) and stops for reduced motion.

const LEG = { stroke: "#c48a52", strokeWidth: 1.6, strokeLinecap: "round" as const, fill: "none" };

function Reindeer({ x, lead = false, phase }: { x: number; lead?: boolean; phase: string }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <g className="santa-bob" style={{ animationDelay: phase }}>
        {/* Back and front legs gallop in opposite directions. */}
        <g className="santa-leg" style={{ animationDelay: phase }}>
          <path d="M7 23 L4 30 M9.5 23 L7.5 30" {...LEG} />
        </g>
        <g className="santa-leg santa-leg-alt" style={{ animationDelay: phase }}>
          <path d="M15 23 L16.5 30 M17.5 23 L20 30" {...LEG} />
        </g>
        <path d="M3.5 18.5 L1 16.5" {...LEG} />
        <ellipse cx="11.5" cy="20" rx="8.5" ry="4.3" fill="#c48a52" />
        <path d="M17.5 18 L21.5 11.5" stroke="#c48a52" strokeWidth="3.4" strokeLinecap="round" />
        <ellipse cx="23.5" cy="10.3" rx="3.5" ry="2.3" fill="#c48a52" />
        <path
          d="M22 8.4 L20.2 3 M20.9 5.3 L18.4 4.3 M23.6 8.2 L25.2 3 M24.6 5 L27.2 4.2"
          stroke="#f3e3c3"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="23.6" cy="9.6" r="0.6" fill="#2b1d12" />
        {lead ? (
          <circle cx="27" cy="10.8" r="1.4" fill="#ff4d4d" className="santa-nose" />
        ) : (
          <circle cx="26.8" cy="10.8" r="0.9" fill="#2b1d12" />
        )}
      </g>
    </g>
  );
}

export default function SantaSleigh() {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="-14 0 146 36"
      className="santa-fly h-10 w-auto shrink-0 overflow-visible sm:h-11"
    >
      {/* Sparkle trail behind the sleigh */}
      <g fill="#f6d77a">
        <circle cx="-10" cy="26" r="1.2" className="santa-sparkle" />
        <circle cx="-4" cy="20" r="0.9" className="santa-sparkle" style={{ animationDelay: "-0.4s" }} />
        <circle cx="-12" cy="16" r="0.8" className="santa-sparkle" style={{ animationDelay: "-0.8s" }} />
      </g>

      {/* Reins */}
      <path d="M26 15 Q62 9 96 19" stroke="#f6d77a" strokeWidth="0.8" fill="none" />
      <path d="M86 19 Q91 17 96 19" stroke="#f6d77a" strokeWidth="0.8" fill="none" />

      {/* Sleigh, Santa and his sack */}
      <g className="santa-bob">
        <circle cx="34" cy="15" r="4.2" fill="#c99a2e" />
        <path d="M32.6 11.2 Q34 9.6 35.4 11.2" stroke="#8a6414" strokeWidth="0.8" fill="none" />
        <circle cx="22" cy="16.5" r="6" fill="#d42a33" />
        <circle cx="22" cy="9.2" r="3.2" fill="#f6d2b5" />
        <ellipse cx="22" cy="12.4" rx="3.7" ry="2.7" fill="#ffffff" />
        <circle cx="21" cy="8.9" r="0.45" fill="#2b1d12" />
        <circle cx="23.2" cy="8.9" r="0.45" fill="#2b1d12" />
        <path d="M18.8 7.6 Q21.5 1 27.2 4 L25.6 7.6 Z" fill="#d42a33" />
        <rect x="18.4" y="6.8" width="7.4" height="1.7" rx="0.85" fill="#ffffff" />
        <circle cx="27.2" cy="4" r="1.3" fill="#ffffff" />
        <path
          d="M6 18 H38 Q42.5 18 41.2 24 L39.4 30 H10 Q4 30 4 24 Z"
          fill="#b3202a"
          stroke="#f6d77a"
          strokeWidth="1.2"
        />
        <path d="M12 30 V34 M32 30 V34" stroke="#f6d77a" strokeWidth="1.4" />
        <path d="M1 34 H40 Q46 34 46.5 28" stroke="#f6d77a" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </g>

      <Reindeer x={62} phase="-0.25s" />
      <Reindeer x={96} lead phase="0s" />
    </svg>
  );
}
