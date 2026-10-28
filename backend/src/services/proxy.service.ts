import axios, { type AxiosRequestConfig, type Method } from 'axios';
import type { IKeyValue, IAuth, IBody, HttpMethod } from '../models/index.js';
import type { IEnvironmentVariable } from '../models/index.js';
import { interpolate } from '../utils/interpolate.js';

export interface ProxyRequest {
  method: HttpMethod;
  url: string;
  headers: IKeyValue[];
  queryParams: IKeyValue[];
  auth: IAuth;
  body: IBody;
}

export interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  size: number;
  duration: number;
}

/**
 * Build outbound headers including auth directives.
 */
function buildHeaders(
  headers: IKeyValue[],
  auth: IAuth,
  variables: IEnvironmentVariable[]
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const h of headers) {
    if (h.enabled) {
      result[interpolate(h.key, variables)] = interpolate(h.value, variables);
    }
  }

  switch (auth.type) {
    case 'bearer':
      if (auth.bearer?.token) {
        result['Authorization'] = `Bearer ${interpolate(auth.bearer.token, variables)}`;
      }
      break;
    case 'basic':
      if (auth.basic?.username) {
        const user = interpolate(auth.basic.username, variables);
        const pass = interpolate(auth.basic.password || '', variables);
        result['Authorization'] = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
      }
      break;
    case 'apikey':
      if (auth.apikey?.addTo === 'header' && auth.apikey.key) {
        result[interpolate(auth.apikey.key, variables)] = interpolate(auth.apikey.value || '', variables);
      }
      break;
  }

  return result;
}

/**
 * Build query parameter string.
 */
function buildParams(
  queryParams: IKeyValue[],
  auth: IAuth,
  variables: IEnvironmentVariable[]
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const p of queryParams) {
    if (p.enabled) {
      result[interpolate(p.key, variables)] = interpolate(p.value, variables);
    }
  }

  if (auth.type === 'apikey' && auth.apikey?.addTo === 'query' && auth.apikey.key) {
    result[interpolate(auth.apikey.key, variables)] = interpolate(auth.apikey.value || '', variables);
  }

  return result;
}

/**
 * Build request body based on mode.
 */
function buildBody(
  body: IBody,
  variables: IEnvironmentVariable[]
): { data: unknown; contentType: string | null } {
  switch (body.mode) {
    case 'json':
      return { data: body.raw ? interpolate(body.raw, variables) : undefined, contentType: 'application/json' };
    case 'urlencoded': {
      const params = new URLSearchParams();
      for (const item of body.urlencoded || []) {
        if (item.enabled) {
          params.append(interpolate(item.key, variables), interpolate(item.value, variables));
        }
      }
      return { data: params.toString(), contentType: 'application/x-www-form-urlencoded' };
    }
    case 'text':
      return { data: body.raw ? interpolate(body.raw, variables) : undefined, contentType: 'text/plain' };
    default:
      return { data: undefined, contentType: null };
  }
}

/**
 * Execute an HTTP request via server-side proxy with high-resolution timing.
 */
export async function executeRequest(
  req: ProxyRequest,
  variables: IEnvironmentVariable[] = []
): Promise<ProxyResponse> {
  const url = interpolate(req.url, variables);
  const headers = buildHeaders(req.headers, req.auth, variables);
  const params = buildParams(req.queryParams, req.auth, variables);
  const { data, contentType } = buildBody(req.body, variables);

  if (contentType && !headers['Content-Type']) {
    headers['Content-Type'] = contentType;
  }

  const axiosConfig: AxiosRequestConfig = {
    method: req.method.toLowerCase() as Method,
    url,
    headers,
    params,
    data,
    validateStatus: () => true,
    maxRedirects: 10,
    timeout: 30000,
    responseType: 'text',
    transformResponse: [(v) => v],
  };

  const startTime = process.hrtime.bigint();
  const response = await axios(axiosConfig);
  const endTime = process.hrtime.bigint();

  const durationMs = Number(endTime - startTime) / 1_000_000;

  const responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  const responseSize = Buffer.byteLength(responseBody, 'utf8');

  // Flatten response headers
  const responseHeaders: Record<string, string> = {};
  for (const [key, val] of Object.entries(response.headers)) {
    responseHeaders[key] = Array.isArray(val) ? val.join(', ') : String(val ?? '');
  }

  return {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
    body: responseBody,
    size: responseSize,
    duration: Math.round(durationMs * 100) / 100,
  };
}
