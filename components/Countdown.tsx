import { connection } from "next/server";

// Runs at request time (outside the prerendered shell) so the count is always current.
export default async function Countdown({ isoDate }: { isoDate: string }) {
  await connection();
  const target = new Date(`${isoDate}T00:00:00`);
  const days = Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86_400_000));
  return (
    <>
      {days} {days === 1 ? "day" : "days"} until Christmas
    </>
  );
}
