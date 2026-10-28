import { Component, inject, input, output, signal, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { WorkspaceStore } from '../../core/services/workspace.store';
import { ToastService } from '../../shared/components/toast/toast.service';
import {
  ApiRequestConfig,
  HttpMethod,
  KeyValue,
  ProxyResponse,
  AuthType
} from '../../core/models/api.models';
import { MethodBadgeComponent } from '../../shared/components/method-badge/method-badge';
import { KeyValueEditorComponent } from '../../shared/components/key-value-editor/key-value-editor';
import { TabsComponent } from '../../shared/components/tabs/tabs';

@Component({
  selector: 'app-request-runner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    KeyValueEditorComponent,
    TabsComponent,
  ],
  template: `
    <div class="runner-container">
      <!-- Top Action Bar -->
      <div class="action-bar">
        <div class="method-picker">
          <select [(ngModel)]="request().method" class="method-select" [ngClass]="'color-' + request().method.toLowerCase()">
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
          </select>
        </div>

        <div class="url-input-wrapper">
          <input
            type="text"
            class="url-input"
            [(ngModel)]="request().url"
            [placeholder]="'https://api.example.com/v1/resource or {{baseUrl}}/endpoint'"
            (keydown.enter)="execute()"
          />
        </div>

        <div class="button-group">
          <button
            type="button"
            class="btn-send"
            [disabled]="isLoading() || !request().url"
            (click)="execute()"
          >
            @if (isLoading()) {
              Sending...
            } @else {
              Send
            }
          </button>

          <button
            type="button"
            class="btn-benchmark"
            [disabled]="isLoading() || !request().url"
            (click)="onOpenBenchmark.emit(request())"
            title="Performance benchmark"
          >
            Benchmark
          </button>

          <button
            type="button"
            class="btn-save"
            (click)="onSave.emit(request())"
            title="Save request (Ctrl+S)"
          >
            Save
          </button>
        </div>
      </div>

      <!-- Request Name & Description Bar (if saved or edited) -->
      <div class="meta-bar">
        <input
          type="text"
          class="name-input"
          [(ngModel)]="request().name"
          placeholder="Untitled Request"
        />
        <input
          type="text"
          class="desc-input"
          [(ngModel)]="request().description"
          placeholder="Add short description or notes..."
        />
      </div>

      <!-- Main Two-Column or Stacked Split -->
      <div class="workspace-split">
        <!-- Request Editor Pane -->
        <div class="panel-section request-section">
          <app-tabs
            [tabs]="['Params', 'Headers', 'Auth', 'Body']"
            [activeTab]="activeReqTab()"
            (tabChange)="activeReqTab.set($event)"
          />

          <div class="tab-content">
            <!-- Params Tab -->
            @if (activeReqTab() === 'Params') {
              <div class="editor-subpane">
                <div class="section-hint">Query parameters appended to the URL query string.</div>
                <app-key-value-editor
                  [items]="request().queryParams"
                  [keyPlaceholder]="'Param key (e.g. limit)'"
                  [valuePlaceholder]="'Value (e.g. 10)'"
                  (itemsChange)="request().queryParams = $event"
                />
              </div>
            }

            <!-- Headers Tab -->
            @if (activeReqTab() === 'Headers') {
              <div class="editor-subpane">
                <div class="section-hint">HTTP request headers.</div>
                <app-key-value-editor
                  [items]="request().headers"
                  [keyPlaceholder]="'Header name (e.g. Accept)'"
                  [valuePlaceholder]="'Value (e.g. application/json)'"
                  (itemsChange)="request().headers = $event"
                />
              </div>
            }

            <!-- Auth Tab -->
            @if (activeReqTab() === 'Auth') {
              <div class="editor-subpane auth-pane">
                <div class="auth-row">
                  <label class="field-label">Authentication Type</label>
                  <select [(ngModel)]="request().auth.type" class="auth-select">
                    <option value="none">No Auth</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="apikey">API Key</option>
                  </select>
                </div>

                @if (request().auth.type === 'bearer') {
                  <div class="auth-fields">
                    <label class="field-label">Token</label>
                    <input
                      type="text"
                      class="mono-input"
                      [placeholder]="'e.g. eyJhbGciOi... or {{token}}'"
                      [ngModel]="request().auth.bearer?.token"
                      (ngModelChange)="setBearerToken($event)"
                    />
                  </div>
                }

                @if (request().auth.type === 'basic') {
                  <div class="auth-fields grid-2">
                    <div>
                      <label class="field-label">Username</label>
                      <input
                        type="text"
                        class="mono-input"
                        placeholder="Username"
                        [ngModel]="request().auth.basic?.username"
                        (ngModelChange)="setBasicUsername($event)"
                      />
                    </div>
                    <div>
                      <label class="field-label">Password</label>
                      <input
                        type="password"
                        class="mono-input"
                        placeholder="Password"
                        [ngModel]="request().auth.basic?.password"
                        (ngModelChange)="setBasicPassword($event)"
                      />
                    </div>
                  </div>
                }

                @if (request().auth.type === 'apikey') {
                  <div class="auth-fields grid-3">
                    <div>
                      <label class="field-label">Key Name</label>
                      <input
                        type="text"
                        class="mono-input"
                        placeholder="X-API-Key"
                        [ngModel]="request().auth.apikey?.key"
                        (ngModelChange)="setApiKeyField('key', $event)"
                      />
                    </div>
                    <div>
                      <label class="field-label">Key Value</label>
                      <input
                        type="text"
                        class="mono-input"
                        placeholder="Key value"
                        [ngModel]="request().auth.apikey?.value"
                        (ngModelChange)="setApiKeyField('value', $event)"
                      />
                    </div>
                    <div>
                      <label class="field-label">Add To</label>
                      <select
                        class="auth-select"
                        [ngModel]="request().auth.apikey?.addTo"
                        (ngModelChange)="setApiKeyField('addTo', $event)"
                      >
                        <option value="header">Header</option>
                        <option value="query">Query Params</option>
                      </select>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- Body Tab -->
            @if (activeReqTab() === 'Body') {
              <div class="editor-subpane body-pane">
                <div class="body-mode-bar">
                  <div class="radio-group">
                    <label class="radio-label">
                      <input type="radio" value="none" [(ngModel)]="request().body.mode" /> None
                    </label>
                    <label class="radio-label">
                      <input type="radio" value="json" [(ngModel)]="request().body.mode" /> JSON
                    </label>
                    <label class="radio-label">
                      <input type="radio" value="urlencoded" [(ngModel)]="request().body.mode" /> Form URL-Encoded
                    </label>
                    <label class="radio-label">
                      <input type="radio" value="text" [(ngModel)]="request().body.mode" /> Text
                    </label>
                  </div>

                  @if (request().body.mode === 'json') {
                    <button type="button" class="btn-tool" (click)="formatJsonBody()">
                      Format JSON
                    </button>
                  }
                </div>

                @if (request().body.mode === 'json' || request().body.mode === 'text') {
                  <textarea
                    class="code-editor"
                    rows="10"
                    [(ngModel)]="request().body.raw"
                    placeholder="Enter payload here..."
                  ></textarea>
                }

                @if (request().body.mode === 'urlencoded') {
                  <app-key-value-editor
                    [items]="request().body.urlencoded || []"
                    [keyPlaceholder]="'Form key'"
                    [valuePlaceholder]="'Form value'"
                    (itemsChange)="request().body.urlencoded = $event"
                  />
                }

                @if (request().body.mode === 'none') {
                  <div class="section-hint">This request does not include a body payload.</div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Response Viewer Pane -->
        <div class="panel-section response-section">
          <div class="response-header">
            <app-tabs
              [tabs]="['Body', 'Headers', 'Raw']"
              [activeTab]="activeResTab()"
              (tabChange)="activeResTab.set($event)"
            />

            @if (response()) {
              <div class="metrics-bar">
                <span class="metric-badge" [ngClass]="getStatusClass(response()!.status)">
                  {{ response()!.status }} {{ response()!.statusText }}
                </span>
                <span class="metric-pill">
                  {{ response()!.duration }} ms
                </span>
                <span class="metric-pill">
                  {{ formatBytes(response()!.size) }}
                </span>
              </div>
            }
          </div>

          <div class="response-content">
            @if (isLoading()) {
              <div class="state-message">
                <div class="loading-indicator">Executing request...</div>
              </div>
            } @else if (!response()) {
              <div class="state-message">
                <div class="empty-title">Ready to test</div>
                <div class="empty-sub">Enter an endpoint URL above and press Send (Ctrl+Enter)</div>
              </div>
            } @else {
              <!-- Response Body Tab -->
              @if (activeResTab() === 'Body') {
                <div class="res-body-wrapper">
                  <div class="body-toolbar">
                    <span class="toolbar-label">{{ formattedBodyType() }}</span>
                    <button type="button" class="btn-tool" (click)="copyResponse()">
                      Copy
                    </button>
                  </div>
                  <pre class="res-code-block"><code>{{ formattedResponseBody() }}</code></pre>
                </div>
              }

              <!-- Response Headers Tab -->
              @if (activeResTab() === 'Headers') {
                <div class="res-headers-table">
                  <table class="headers-table">
                    <thead>
                      <tr>
                        <th>Header</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of responseHeaderEntries(); track item.key) {
                        <tr>
                          <td class="hdr-key">{{ item.key }}</td>
                          <td class="hdr-val">{{ item.value }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <!-- Raw Response Tab -->
              @if (activeResTab() === 'Raw') {
                <div class="res-raw-wrapper">
                  <pre class="res-code-block"><code>{{ response()!.body }}</code></pre>
                </div>
              }
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .runner-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #09090b;
      gap: 12px;
    }
    .action-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 0 4px 0;
    }
    .method-picker {
      width: 110px;
      flex-shrink: 0;
    }
    .method-select {
      width: 100%;
      background: #18181b;
      border: 1px solid #27272a;
      color: #fafafa;
      font-family: var(--font-mono, monospace);
      font-size: 13px;
      font-weight: 700;
      padding: 8px 10px;
      border-radius: 4px;
      cursor: pointer;
    }
    .color-get { color: #38bdf8; }
    .color-post { color: #4ade80; }
    .color-put { color: #fbbf24; }
    .color-patch { color: #c084fc; }
    .color-delete { color: #f87171; }
    .color-head, .color-options { color: #a1a1aa; }

    .url-input-wrapper {
      flex: 1;
    }
    .url-input {
      width: 100%;
      background: #18181b;
      border: 1px solid #27272a;
      color: #fafafa;
      font-family: var(--font-mono, monospace);
      font-size: 13px;
      padding: 8px 12px;
      border-radius: 4px;
    }
    .url-input:focus {
      border-color: #52525b;
      outline: none;
    }
    .button-group {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }
    .btn-send {
      background: #fafafa;
      color: #09090b;
      border: none;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 18px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-send:hover:not(:disabled) {
      background: #e4e4e7;
    }
    .btn-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-benchmark {
      background: #18181b;
      color: #a1a1aa;
      border: 1px solid #27272a;
      font-size: 13px;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-benchmark:hover:not(:disabled) {
      background: #27272a;
      color: #fafafa;
    }
    .btn-save {
      background: #18181b;
      color: #a1a1aa;
      border: 1px solid #27272a;
      font-size: 13px;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-save:hover {
      background: #27272a;
      color: #fafafa;
    }

    .meta-bar {
      display: flex;
      gap: 8px;
    }
    .name-input {
      width: 220px;
      font-size: 13px;
      font-weight: 500;
      background: transparent;
      border: 1px solid transparent;
      padding: 4px 6px;
      color: #fafafa;
    }
    .name-input:focus {
      border: 1px solid #27272a;
      background: #18181b;
      border-radius: 3px;
    }
    .desc-input {
      flex: 1;
      font-size: 12px;
      color: #71717a;
      background: transparent;
      border: 1px solid transparent;
      padding: 4px 6px;
    }
    .desc-input:focus {
      border: 1px solid #27272a;
      background: #18181b;
      border-radius: 3px;
      color: #fafafa;
    }

    .workspace-split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      flex: 1;
      min-height: 0;
    }
    @media (max-width: 960px) {
      .workspace-split {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr 1fr;
      }
    }

    .panel-section {
      background: #121215;
      border: 1px solid #27272a;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
    .tab-content {
      padding: 12px;
      flex: 1;
      overflow-y: auto;
    }
    .section-hint {
      font-size: 12px;
      color: #71717a;
      margin-bottom: 10px;
    }
    .auth-row, .auth-fields {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 12px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 120px;
      gap: 8px;
    }
    .field-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #71717a;
      font-weight: 500;
    }
    .auth-select {
      background: #18181b;
      border: 1px solid #27272a;
      color: #fafafa;
      font-size: 12px;
      padding: 6px 8px;
      border-radius: 3px;
    }
    .mono-input {
      background: #18181b;
      border: 1px solid #27272a;
      color: #fafafa;
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      padding: 6px 8px;
      border-radius: 3px;
    }
    .mono-input:focus, .auth-select:focus {
      border-color: #52525b;
      outline: none;
    }

    .body-mode-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .radio-group {
      display: flex;
      gap: 12px;
    }
    .radio-label {
      font-size: 12px;
      color: #a1a1aa;
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
    }
    .radio-label input {
      accent-color: #fafafa;
      cursor: pointer;
    }
    .btn-tool {
      background: #18181b;
      border: 1px solid #27272a;
      color: #a1a1aa;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 3px;
      cursor: pointer;
    }
    .btn-tool:hover {
      background: #27272a;
      color: #fafafa;
    }

    .code-editor {
      width: 100%;
      height: 220px;
      background: #18181b;
      border: 1px solid #27272a;
      color: #fafafa;
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      padding: 8px;
      border-radius: 4px;
      resize: vertical;
      line-height: 1.4;
    }
    .code-editor:focus {
      border-color: #52525b;
      outline: none;
    }

    /* Response section styles */
    .response-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #27272a;
      padding-right: 12px;
    }
    .metrics-bar {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .metric-badge {
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 3px;
    }
    .status-ok {
      background: #064e3b;
      color: #4ade80;
      border: 1px solid #059669;
    }
    .status-redirect {
      background: #1e293b;
      color: #38bdf8;
      border: 1px solid #0369a1;
    }
    .status-client-err {
      background: #451a03;
      color: #fbbf24;
      border: 1px solid #d97706;
    }
    .status-server-err {
      background: #450a0a;
      color: #f87171;
      border: 1px solid #dc2626;
    }
    .metric-pill {
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      color: #71717a;
      background: #18181b;
      padding: 2px 6px;
      border-radius: 3px;
      border: 1px solid #27272a;
    }

    .response-content {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .state-message {
      margin: auto;
      text-align: center;
      color: #71717a;
      padding: 32px;
    }
    .empty-title {
      font-size: 14px;
      font-weight: 500;
      color: #a1a1aa;
      margin-bottom: 4px;
    }
    .empty-sub {
      font-size: 12px;
    }
    .loading-indicator {
      font-size: 13px;
      color: #a1a1aa;
      font-family: var(--font-mono, monospace);
    }

    .res-body-wrapper, .res-raw-wrapper {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .body-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .toolbar-label {
      font-size: 11px;
      color: #71717a;
      font-family: var(--font-mono, monospace);
      text-transform: uppercase;
    }
    .res-code-block {
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 4px;
      padding: 10px;
      margin: 0;
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      line-height: 1.45;
      color: #fafafa;
      overflow-x: auto;
      flex: 1;
      max-height: 480px;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .res-headers-table {
      padding: 10px 12px;
    }
    .headers-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      font-family: var(--font-mono, monospace);
    }
    .headers-table th {
      text-align: left;
      padding: 6px 8px;
      color: #71717a;
      font-weight: 500;
      border-bottom: 1px solid #27272a;
    }
    .headers-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #1f1f23;
    }
    .hdr-key {
      color: #38bdf8;
      width: 35%;
    }
    .hdr-val {
      color: #d4d4d8;
      word-break: break-all;
    }
  `]
})
export class RequestRunnerComponent {
  private api = inject(ApiService);
  private store = inject(WorkspaceStore);
  private toast = inject(ToastService);

  readonly request = input<ApiRequestConfig>({
    name: 'New Request',
    description: '',
    method: 'GET',
    url: '',
    headers: [],
    queryParams: [],
    auth: { type: 'none' },
    body: { mode: 'none' }
  });

  readonly onSave = output<ApiRequestConfig>();
  readonly onOpenBenchmark = output<ApiRequestConfig>();

  readonly activeReqTab = signal<string>('Params');
  readonly activeResTab = signal<string>('Body');
  readonly isLoading = signal<boolean>(false);
  readonly response = signal<ProxyResponse | null>(null);

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      if (!this.isLoading() && this.request().url) {
        this.execute();
      }
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.onSave.emit(this.request());
    }
  }

  async execute(): Promise<void> {
    if (!this.request().url) {
      this.toast.show('Please provide a request URL', 'error');
      return;
    }

    this.isLoading.set(true);
    const activeEnvId = this.store.activeEnvironment()?._id;
    const activeWsId = this.store.activeWorkspaceId();

    const payload: ApiRequestConfig = {
      ...this.request(),
      workspaceId: activeWsId || undefined,
    };

    this.api.sendRequest(payload, activeEnvId).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.response.set(res.data);
          // Refresh history in store
          this.store.loadHistory();
        } else {
          this.toast.show(res.error || 'Request failed', 'error');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.show(err.message || 'Execution error', 'error');
      }
    });
  }

  formatJsonBody(): void {
    try {
      const current = this.request().body.raw;
      if (current) {
        const parsed = JSON.parse(current);
        this.request().body.raw = JSON.stringify(parsed, null, 2);
        this.toast.show('JSON formatted', 'info');
      }
    } catch {
      this.toast.show('Invalid JSON syntax', 'error');
    }
  }

  setBearerToken(token: string): void {
    this.request().auth.bearer = { token };
  }

  setBasicUsername(username: string): void {
    if (!this.request().auth.basic) {
      this.request().auth.basic = { username: '', password: '' };
    }
    const basic = this.request().auth.basic;
    if (basic) basic.username = username;
  }

  setBasicPassword(password: string): void {
    if (!this.request().auth.basic) {
      this.request().auth.basic = { username: '', password: '' };
    }
    const basic = this.request().auth.basic;
    if (basic) basic.password = password;
  }

  setApiKeyField(field: 'key' | 'value' | 'addTo', val: string): void {
    if (!this.request().auth.apikey) {
      this.request().auth.apikey = { key: '', value: '', addTo: 'header' };
    }
    const apikey = this.request().auth.apikey;
    if (!apikey) return;
    if (field === 'addTo') {
      apikey.addTo = val as 'header' | 'query';
    } else {
      apikey[field] = val;
    }
  }

  formattedResponseBody(): string {
    const res = this.response();
    if (!res) return '';
    try {
      const parsed = JSON.parse(res.body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return res.body;
    }
  }

  formattedBodyType(): string {
    const res = this.response();
    if (!res) return 'TEXT';
    try {
      JSON.parse(res.body);
      return 'JSON';
    } catch {
      return 'RAW';
    }
  }

  responseHeaderEntries(): { key: string; value: string }[] {
    const res = this.response();
    if (!res || !res.headers) return [];
    return Object.entries(res.headers).map(([key, value]) => ({ key, value }));
  }

  getStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'status-ok';
    if (status >= 300 && status < 400) return 'status-redirect';
    if (status >= 400 && status < 500) return 'status-client-err';
    return 'status-server-err';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  copyResponse(): void {
    const body = this.formattedResponseBody();
    if (body) {
      navigator.clipboard.writeText(body);
      this.toast.show('Copied response to clipboard', 'info');
    }
  }
}
