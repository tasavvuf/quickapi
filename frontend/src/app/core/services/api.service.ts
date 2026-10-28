import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiRequestConfig,
  ApiResponse,
  BenchmarkResult,
  Collection,
  Comment,
  Environment,
  HistoryEntry,
  ProxyResponse,
  Workspace,
} from '../models/api.models';

const BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // -- Proxy / Send --

  sendRequest(
    request: ApiRequestConfig,
    environmentId?: string,
  ): Observable<ApiResponse<ProxyResponse>> {
    const body: Record<string, unknown> = { ...request };
    if (environmentId) body['environmentId'] = environmentId;
    return this.http.post<ApiResponse<ProxyResponse>>(`${BASE}/proxy/send`, body);
  }

  // -- Benchmark --

  runBenchmark(
    request: ApiRequestConfig,
    environmentId?: string,
    iterations?: number,
    concurrency?: number,
  ): Observable<ApiResponse<BenchmarkResult>> {
    const body: Record<string, unknown> = { ...request };
    if (environmentId) body['environmentId'] = environmentId;
    if (iterations) body['iterations'] = iterations;
    if (concurrency) body['concurrency'] = concurrency;
    return this.http.post<ApiResponse<BenchmarkResult>>(`${BASE}/proxy/benchmark`, body);
  }

  // -- Workspaces --

  getWorkspaces(): Observable<ApiResponse<Workspace[]>> {
    return this.http.get<ApiResponse<Workspace[]>>(`${BASE}/workspaces`);
  }

  createWorkspace(name: string, description: string): Observable<ApiResponse<Workspace>> {
    return this.http.post<ApiResponse<Workspace>>(`${BASE}/workspaces`, { name, description });
  }

  updateWorkspace(
    id: string,
    data: Partial<Workspace>,
  ): Observable<ApiResponse<Workspace>> {
    return this.http.put<ApiResponse<Workspace>>(`${BASE}/workspaces/${id}`, data);
  }

  deleteWorkspace(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${BASE}/workspaces/${id}`);
  }

  // -- Collections --

  getCollections(workspaceId: string): Observable<ApiResponse<Collection[]>> {
    return this.http.get<ApiResponse<Collection[]>>(
      `${BASE}/collections`,
      { params: { workspaceId } },
    );
  }

  createCollection(data: Partial<Collection>): Observable<ApiResponse<Collection>> {
    return this.http.post<ApiResponse<Collection>>(`${BASE}/collections`, data);
  }

  updateCollection(
    id: string,
    data: Partial<Collection>,
  ): Observable<ApiResponse<Collection>> {
    return this.http.put<ApiResponse<Collection>>(`${BASE}/collections/${id}`, data);
  }

  deleteCollection(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${BASE}/collections/${id}`);
  }

  // -- Requests --

  getRequests(
    collectionId?: string,
    workspaceId?: string,
  ): Observable<ApiResponse<ApiRequestConfig[]>> {
    let params = new HttpParams();
    if (collectionId) params = params.set('collectionId', collectionId);
    if (workspaceId) params = params.set('workspaceId', workspaceId);
    return this.http.get<ApiResponse<ApiRequestConfig[]>>(`${BASE}/requests`, { params });
  }

  getRequest(id: string): Observable<ApiResponse<ApiRequestConfig>> {
    return this.http.get<ApiResponse<ApiRequestConfig>>(`${BASE}/requests/${id}`);
  }

  createRequest(data: Partial<ApiRequestConfig>): Observable<ApiResponse<ApiRequestConfig>> {
    return this.http.post<ApiResponse<ApiRequestConfig>>(`${BASE}/requests`, data);
  }

  updateRequest(
    id: string,
    data: Partial<ApiRequestConfig>,
  ): Observable<ApiResponse<ApiRequestConfig>> {
    return this.http.put<ApiResponse<ApiRequestConfig>>(`${BASE}/requests/${id}`, data);
  }

  deleteRequest(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${BASE}/requests/${id}`);
  }

  // -- History --

  getHistory(
    workspaceId: string,
    method?: string,
    limit?: number,
  ): Observable<ApiResponse<HistoryEntry[]>> {
    let params = new HttpParams().set('workspaceId', workspaceId);
    if (method) params = params.set('method', method);
    if (limit) params = params.set('limit', limit.toString());
    return this.http.get<ApiResponse<HistoryEntry[]>>(`${BASE}/history`, { params });
  }

  deleteHistory(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${BASE}/history/${id}`);
  }

  clearHistory(workspaceId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${BASE}/history/clear`,
      { params: { workspaceId } },
    );
  }

  // -- Environments --

  getEnvironments(workspaceId: string): Observable<ApiResponse<Environment[]>> {
    return this.http.get<ApiResponse<Environment[]>>(
      `${BASE}/environments`,
      { params: { workspaceId } },
    );
  }

  createEnvironment(data: Partial<Environment>): Observable<ApiResponse<Environment>> {
    return this.http.post<ApiResponse<Environment>>(`${BASE}/environments`, data);
  }

  updateEnvironment(
    id: string,
    data: Partial<Environment>,
  ): Observable<ApiResponse<Environment>> {
    return this.http.put<ApiResponse<Environment>>(`${BASE}/environments/${id}`, data);
  }

  deleteEnvironment(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${BASE}/environments/${id}`);
  }

  // -- Documentation --

  getDocumentation(collectionId: string, format: string): Observable<string> {
    return this.http.get(`${BASE}/documentation/${collectionId}`, {
      params: { format },
      responseType: 'text',
    });
  }

  // -- Comments --

  getComments(requestId: string): Observable<ApiResponse<Comment[]>> {
    return this.http.get<ApiResponse<Comment[]>>(
      `${BASE}/comments`,
      { params: { requestId } },
    );
  }

  createComment(data: Partial<Comment>): Observable<ApiResponse<Comment>> {
    return this.http.post<ApiResponse<Comment>>(`${BASE}/comments`, data);
  }

  deleteComment(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${BASE}/comments/${id}`);
  }
}
