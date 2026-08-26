export function daysBetween(a: string | Date, b: string | Date): number {
  const ad = typeof a === 'string' ? new Date(a) : a;
  const bd = typeof b === 'string' ? new Date(b) : b;
  return Math.round(Math.abs(bd.getTime() - ad.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
