import { scaleLinear } from 'd3-scale';

// Blue -> Green -> Yellow -> Orange -> Red gradient
const colorScale = scaleLinear<string>()
  .domain([0, 0.25, 0.5, 0.75, 1])
  .range(['#3B82F6', '#10B981', '#FDE047', '#F97316', '#EF4444']);

export function getColorForValue(normalizedValue: number): string {
  return colorScale(Math.max(0, Math.min(1, normalizedValue)));
}
