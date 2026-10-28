import type { Request, Response, NextFunction } from 'express';
import { executeRequest, type ProxyRequest } from '../services/proxy.service.js';
import { runBenchmark } from '../services/benchmark.service.js';
import { History, Environment } from '../models/index.js';

/**
 * POST /api/v1/proxy/send
 * Execute an HTTP request via server-side proxy.
 */
export async function sendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { method, url, headers = [], queryParams = [], auth = { type: 'none' }, body = { mode: 'none' }, workspaceId, requestId, environmentId } = req.body;

    // Load environment variables if an environment is specified
    let variables: { key: string; value: string; isSecret: boolean; enabled: boolean }[] = [];
    if (environmentId) {
      const env = await Environment.findById(environmentId);
      if (env) {
        variables = env.variables;
      }
    }

    const proxyReq: ProxyRequest = { method, url, headers, queryParams, auth, body };
    const result = await executeRequest(proxyReq, variables);

    // Save to history
    if (workspaceId) {
      await History.create({
        workspaceId,
        requestId: requestId || null,
        method,
        url,
        requestHeaders: Object.fromEntries(headers.filter((h: any) => h.enabled).map((h: any) => [h.key, h.value])),
        requestBody: body.raw || null,
        responseStatus: result.status,
        responseStatusText: result.statusText,
        responseHeaders: result.headers,
        responseBody: result.body.substring(0, 500_000),
        responseSize: result.size,
        duration: result.duration,
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/proxy/benchmark
 * Run performance benchmark on an endpoint.
 */
export async function benchmark(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { method, url, headers = [], queryParams = [], auth = { type: 'none' }, body = { mode: 'none' }, environmentId, iterations = 10, concurrency = 1 } = req.body;

    let variables: { key: string; value: string; isSecret: boolean; enabled: boolean }[] = [];
    if (environmentId) {
      const env = await Environment.findById(environmentId);
      if (env) variables = env.variables;
    }

    const proxyReq: ProxyRequest = { method, url, headers, queryParams, auth, body };
    const result = await runBenchmark(proxyReq, variables, { iterations, concurrency });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
