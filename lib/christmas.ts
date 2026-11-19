// Pure date helpers for the Christmas countdown (viewer's local time zone).

export type CountdownState =
  | { kind: "counting"; days: number; hours: number; minutes: number; seconds: number }
  | { kind: "christmas" };

/** Time left until the next Christmas Day (local midnight), or "christmas" on the day itself. */
export function countdownTo(now: Date): CountdownState {
  const year = now.getFullYear();
  if (now.getMonth() === 11 && now.getDate() === 25) return { kind: "christmas" };
  const thisYear = new Date(year, 11, 25);
  const target = now < thisYear ? thisYear : new Date(year + 1, 11, 25);
  let s = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const days = Math.floor(s / 86_400);
  s -= days * 86_400;
  const hours = Math.floor(s / 3_600);
  s -= hours * 3_600;
  const minutes = Math.floor(s / 60);
  return { kind: "counting", days, hours, minutes, seconds: s - minutes * 60 };
}
