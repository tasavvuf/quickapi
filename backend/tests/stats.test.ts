import { describe, it, expect } from 'vitest';
import { computeStats } from '../src/utils/stats.js';

describe('Performance Statistics Calculation', () => {
  it('handles empty input gracefully', () => {
    const stats = computeStats([]);
    expect(stats.count).toBe(0);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(0);
    expect(stats.mean).toBe(0);
  });

  it('computes exact min, max, mean, median and percentiles', () => {
    // 10 sample latencies
    const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const stats = computeStats(latencies);

    expect(stats.count).toBe(10);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(100);
    expect(stats.mean).toBe(55);
    expect(stats.median).toBe(55);
    expect(stats.p95).toBe(100);
    expect(stats.stdDev).toBeGreaterThan(0);
  });

  it('correctly handles single element arrays', () => {
    const stats = computeStats([42.5]);
    expect(stats.count).toBe(1);
    expect(stats.min).toBe(42.5);
    expect(stats.max).toBe(42.5);
    expect(stats.mean).toBe(42.5);
    expect(stats.median).toBe(42.5);
  });
});
