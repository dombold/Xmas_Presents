// Decorative falling snow for the banner. Positions are fixed per flake index (no randomness
// during render), and the animation only uses transform/opacity. Hidden for reduced motion.
const FLAKES = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37) % 100, // spread across the width
  size: 3 + ((i * 7) % 5), // 3–7px
  duration: 9 + ((i * 5) % 8), // 9–16s
  delay: -((i * 13) % 16), // negative so snow is already falling on load
  drift: ((i % 5) - 2) * 12, // sideways sway in px
}));

export default function Snowfall() {
  return (
    <div aria-hidden className="snowfall pointer-events-none absolute inset-0 overflow-hidden">
      {FLAKES.map((f, i) => (
        <span
          key={i}
          className="snowflake"
          style={
            {
              left: `${f.left}%`,
              width: f.size,
              height: f.size,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              "--drift": `${f.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
