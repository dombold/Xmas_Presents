// Gift-box app icon drawn with plain shapes (no emoji or remote fonts), shared by
// app/icon.tsx and app/apple-icon.tsx. Kept inside the central ~70% so it survives
// "maskable" cropping on Android.
const PINE = "#1f6b45";
const RED = "#b3202a";
const GOLD = "#e2b94f";

export function GiftIcon({ size }: { size: number }) {
  const u = size / 100; // work in percent of the icon
  const box = (left: number, top: number, width: number, height: number, background: string, extra = {}) => (
    <div
      style={{
        position: "absolute",
        left: left * u,
        top: top * u,
        width: width * u,
        height: height * u,
        background,
        ...extra,
      }}
    />
  );
  return (
    <div style={{ width: size, height: size, background: PINE, position: "relative", display: "flex" }}>
      {/* bow loops */}
      {box(33, 18, 17, 14, "transparent", { border: `${4.5 * u}px solid ${GOLD}`, borderRadius: "50% 50% 10% 50%" })}
      {box(50, 18, 17, 14, "transparent", { border: `${4.5 * u}px solid ${GOLD}`, borderRadius: "50% 50% 50% 10%" })}
      {/* box body and lid */}
      {box(24, 46, 52, 36, RED, { borderRadius: 3 * u })}
      {box(20, 33, 60, 15, RED, { borderRadius: 3 * u, boxShadow: `0 ${1.5 * u}px 0 rgba(0,0,0,0.25)` })}
      {/* ribbons */}
      {box(45, 33, 10, 49, GOLD)}
    </div>
  );
}
