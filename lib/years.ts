// Kept outside component bodies: reading the clock during render is flagged by the React compiler lint.
export function currentYear() {
  return new Date().getFullYear();
}

/** Parse ?year= into a sensible year, defaulting to this year. */
export function parseYear(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 2000 && n <= 2100 ? n : currentYear();
}
