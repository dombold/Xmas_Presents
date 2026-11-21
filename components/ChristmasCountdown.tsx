"use client";

import { useSyncExternalStore } from "react";
import { countdownTo } from "@/lib/christmas";
import SantaSleigh from "@/components/SantaSleigh";

// A once-a-second clock. The snapshot is whole seconds, so it's stable within a tick.
function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
const getSecond = () => Math.floor(Date.now() / 1000);
// Prerendered HTML has no clock: show placeholder tiles (same size, so nothing jumps).
const getServerSecond = () => null;

const pad = (n: number) => String(n).padStart(2, "0");

function Tile({ value, label, animate }: { value: string; label: string; animate?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-xl border-t-2 border-gold bg-white/15 backdrop-blur-md px-1 py-3 text-center shadow-[0_8px_24px_-12px_rgb(0_0_0/0.45)] ring-1 ring-white/15 sm:py-4">
      <span
        // Keyed on the value so each new number gently drops in (see .countdown-tick).
        key={animate ? value : undefined}
        className={`block text-3xl font-bold tracking-tight tabular-nums text-white sm:text-5xl ${animate ? "countdown-tick" : ""}`}
      >
        {value}
      </span>
      <span className="mt-1 block text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-white/80 sm:text-xs">
        {label}
      </span>
    </div>
  );
}

export default function ChristmasCountdown() {
  const second = useSyncExternalStore(subscribe, getSecond, getServerSecond);
  const state = second === null ? null : countdownTo(new Date(second * 1000));

  if (state?.kind === "christmas") {
    return (
      <p className="countdown-merry mt-6 text-3xl font-bold text-white sm:text-4xl">
        <span aria-hidden>🎅</span> Merry Christmas! <span aria-hidden>🎁</span>
      </p>
    );
  }

  const days = state ? String(state.days) : "–";
  return (
    <div className="mt-6 max-w-md">
      {/* Screen readers get one calm sentence instead of a number changing every second. */}
      <p className="sr-only">{state ? `${state.days} days until Santa comes` : "Counting down to Christmas"}</p>
      <div aria-hidden className="grid grid-cols-4 gap-2 sm:gap-3">
        <Tile value={days} label={state?.days === 1 ? "Day" : "Days"} />
        <Tile value={state ? pad(state.hours) : "––"} label="Hours" />
        <Tile value={state ? pad(state.minutes) : "––"} label="Mins" />
        <Tile value={state ? pad(state.seconds) : "––"} label="Secs" animate={state !== null} />
      </div>
      <p aria-hidden className="mt-3 flex items-center gap-3 text-sm font-medium text-white/85">
        until Santa Comes <SantaSleigh />
      </p>
    </div>
  );
}
