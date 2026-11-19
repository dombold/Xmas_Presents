"use client";

import { useRouter } from "next/navigation";

/** Year picker: newest first; switching loads that year's presents. */
export default function YearSelect({ years, year }: { years: number[]; year: number }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-3 font-semibold">
      Year
      <select
        name="year"
        value={year}
        onChange={(e) => router.push(`/?year=${e.target.value}`)}
        className="input w-auto py-1.5 pr-8 font-semibold"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  );
}
