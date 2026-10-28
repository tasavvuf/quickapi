import { executeRequest, type ProxyRequest, type ProxyResponse } from './proxy.service.js';
import { computeStats, type Stats } from '../utils/stats.js';
import type { IEnvironmentVariable } from '../models/index.js';

export interface BenchmarkConfig {
  iterations: number;
  concurrency: number;
}

export interface BenchmarkResult {
  stats: Stats;
  latencies: number[];
  successCount: number;
  errorCount: number;
  totalDuration: number;
  throughput: number;
}

/**
 * Run a performance benchmark on a single endpoint.
 * Executes `iterations` requests with a maximum of `concurrency` in-flight at once.
 */
export async function runBenchmark(
  request: ProxyRequest,
  variables: IEnvironmentVariable[],
  cfg: BenchmarkConfig
): Promise<BenchmarkResult> {
  const iterations = Math.min(Math.max(cfg.iterations, 1), 200);
  const concurrency = Math.min(Math.max(cfg.concurrency, 1), 10);

  const latencies: number[] = [];
  let successCount = 0;
  let errorCount = 0;

  const overallStart = Date.now();

  // Process in batches of `concurrency`
  for (let i = 0; i < iterations; i += concurrency) {
    const batchSize = Math.min(concurrency, iterations - i);
    const batch: Promise<ProxyResponse | null>[] = [];

    for (let j = 0; j < batchSize; j++) {
      batch.push(
        executeRequest(request, variables)
          .then((res) => {
            latencies.push(res.duration);
            if (res.status >= 200 && res.status < 400) {
              successCount++;
            } else {
              errorCount++;
            }
            return res;
          })
          .catch(() => {
            errorCount++;
            return null;
          })
      );
    }

    await Promise.all(batch);
  }

  const overallEnd = Date.now();
  const totalDuration = overallEnd - overallStart;
  const throughput =
    totalDuration > 0
      ? Math.round(((successCount + errorCount) / (totalDuration / 1000)) * 100) / 100
      : 0;

  return {
    stats: computeStats(latencies),
    latencies,
    successCount,
    errorCount,
    totalDuration,
    throughput,
  };
}
