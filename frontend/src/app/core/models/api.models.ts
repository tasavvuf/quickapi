// -- HTTP & Auth types --

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey';

// -- Shared structures --

export interface KeyValue {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Auth {
  type: AuthType;
  bearer?: { token: string };
  basic?: { username: string; password: string };
  apikey?: { key: string; value: string; addTo: 'header' | 'query' };
}

export interface RequestBody {
  mode: 'none' | 'json' | 'urlencoded' | 'text';
  raw?: string;
  urlencoded?: KeyValue[];
}

// -- Request / Response --

export interface ApiRequestConfig {
  name: string;
  description: string;
  method: HttpMethod;
  url: string;
  headers: KeyValue[];
  queryParams: KeyValue[];
  auth: Auth;
  body: RequestBody;
  collectionId?: string;
  workspaceId?: string;
  _id?: string;
  order?: number;
}

export interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  size: number;
  duration: number;
}

// -- History --

export interface HistoryEntry {
  _id: string;
  workspaceId: string;
  requestId: string | null;
  method: HttpMethod;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  responseStatus: number;
  responseStatusText: string;
  responseHeaders: Record<string, string>;
  responseBody: string;
  responseSize: number;
  duration: number;
  createdAt: string;
}

// -- Environments --

export interface EnvironmentVariable {
  key: string;
  value: string;
  isSecret: boolean;
  enabled: boolean;
}

export interface Environment {
  _id: string;
  name: string;
  workspaceId: string;
  variables: EnvironmentVariable[];
}

// -- Collections --

export interface Collection {
  _id: string;
  name: string;
  description: string;
  workspaceId: string;
  parentId: string | null;
  order: number;
}

// -- Workspaces --

export interface Workspace {
  _id: string;
  name: string;
  description: string;
  owner: string;
  members: { userId: string; role: 'owner' | 'editor' | 'viewer'; name: string }[];
}

// -- Comments --

export interface Comment {
  _id: string;
  requestId: string;
  workspaceId: string;
  author: string;
  content: string;
  createdAt: string;
}

// -- Benchmarking --

export interface BenchmarkStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  stdDev: number;
  count: number;
}

export interface BenchmarkResult {
  stats: BenchmarkStats;
  latencies: number[];
  successCount: number;
  errorCount: number;
  totalDuration: number;
  throughput: number;
}

// -- Generic API wrapper --

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
