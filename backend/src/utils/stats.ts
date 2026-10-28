/**
 * Compute descriptive statistics for an array of numeric values (latencies).
 */
export interface Stats {
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  stdDev: number;
  count: number;
}

export function computeStats(values: number[]): Stats {
  if (!values.length) {
    return { min: 0, max: 0, mean: 0, median: 0, p95: 0, p99: 0, stdDev: 0, count: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

  const p95 = sorted[Math.min(Math.ceil(n * 0.95) - 1, n - 1)];
  const p99 = sorted[Math.min(Math.ceil(n * 0.99) - 1, n - 1)];

  const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    min: sorted[0],
    max: sorted[n - 1],
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    p95: Math.round(p95 * 100) / 100,
    p99: Math.round(p99 * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    count: n,
  };
}

