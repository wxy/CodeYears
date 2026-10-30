import type { DailyContribution } from '../../data/types';
export type Density = 'sparse' | 'regular' | 'dense';
/** Synthetic load only; never represents a GitHub response. */
export function generateDays(density: Density): readonly DailyContribution[] {
  let seed = 20060101;
  const days: DailyContribution[] = [];
  for (let time = Date.UTC(2006, 0, 1); time < Date.UTC(2026, 0, 1); time += 86400000) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const count = density === 'sparse' ? (seed % 20 === 0 ? 1 + seed % 40 : 0)
      : density === 'regular' ? (seed % 5 === 0 ? 0 : 1 + seed % 30) : 50 + seed % 151;
    days.push({ date: new Date(time).toISOString().slice(0, 10), count });
  }
  return days;
}
