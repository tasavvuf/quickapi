import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Collection, ApiRequestConfig } from '../../core/models/api.models';
import { MethodBadgeComponent } from '../../shared/components/method-badge/method-badge';

@Component({
  selector: 'app-documentation-view',
  standalone: true,
  imports: [CommonModule, MethodBadgeComponent],
  template: `
    <div class="docs-container">
      <!-- Top Bar -->
      <div class="docs-header">
        <div class="left-group">
          <button type="button" class="btn-back" (click)="back.emit()">
            &larr; Back to Dashboard
          </button>
          <span class="collection-title">{{ collection()?.name }} Documentation</span>
        </div>

        <div class="export-actions">
          <button type="button" class="btn-export" (click)="exportDoc('markdown')">
            Export Markdown
          </button>
          <button type="button" class="btn-export primary" (click)="exportDoc('json')">
            Export OpenAPI 3.0
          </button>
        </div>
      </div>

      <!-- Main Docs Content -->
      <div class="docs-split">
        <!-- Sidebar Navigation -->
        <div class="endpoints-sidebar">
          <div class="nav-title">Endpoints</div>
          <div class="nav-list">
            @for (req of requests(); track req._id) {
              <a
                class="nav-item"
                [class.active]="selectedRequest()?._id === req._id"
                (click)="selectedRequest.set(req)"
              >
                <app-method-badge [method]="req.method" />
                <span class="nav-name">{{ req.name }}</span>
              </a>
            }
          </div>
        </div>

        <!-- Documentation Detail Pane -->
        <div class="detail-pane">
          @if (selectedRequest()) {
            <div class="endpoint-doc">
              <div class="title-row">
                <app-method-badge [method]="selectedRequest()!.method" />
                <span class="doc-req-name">{{ selectedRequest()!.name }}</span>
              </div>

              <div class="url-box">
                <code>{{ selectedRequest()!.url }}</code>
              </div>

              @if (selectedRequest()!.description) {
                <div class="doc-description">
                  {{ selectedRequest()!.description }}
                </div>
              }

              <!-- Query Parameters -->
              @if (selectedRequest()!.queryParams.length > 0) {
                <div class="doc-section">
                  <h4 class="section-heading">Query Parameters</h4>
                  <table class="doc-table">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Value</th>
                        <th>Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (p of selectedRequest()!.queryParams; track p.key) {
                        <tr>
                          <td class="code-font">{{ p.key }}</td>
                          <td class="code-font muted">{{ p.value || '-' }}</td>
                          <td>Optional</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <!-- Headers -->
              @if (selectedRequest()!.headers.length > 0) {
                <div class="doc-section">
                  <h4 class="section-heading">Headers</h4>
                  <table class="doc-table">
                    <thead>
                      <tr>
                        <th>Header</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (h of selectedRequest()!.headers; track h.key) {
                        <tr>
                          <td class="code-font">{{ h.key }}</td>
                          <td class="code-font muted">{{ h.value || '-' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }

              <!-- Request Body -->
              @if (selectedRequest()!.body.mode !== 'none' && selectedRequest()!.body.raw) {
                <div class="doc-section">
                  <h4 class="section-heading">Request Body ({{ selectedRequest()!.body.mode }})</h4>
                  <pre class="code-snippet"><code>{{ selectedRequest()!.body.raw }}</code></pre>
                </div>
              }

              <!-- cURL command -->
              <div class="doc-section">
                <div class="section-heading-row">
                  <h4 class="section-heading">cURL Command</h4>
                  <button type="button" class="btn-copy-sm" (click)="copyCurl()">
                    Copy cURL
                  </button>
                </div>
                <pre class="code-snippet"><code>{{ generateCurl(selectedRequest()!) }}</code></pre>
              </div>
            </div>
          } @else {
            <div class="empty-docs-message">
              Select an endpoint from the left to view documentation.
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .docs-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #09090b;
    }
    .docs-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      border-bottom: 1px solid #27272a;
      background: #121215;
    }
    .left-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .btn-back {
      background: #18181b;
      border: 1px solid #27272a;
      color: #fafafa;
      font-size: 12px;
      padding: 5px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-back:hover {
      background: #27272a;
    }
    .collection-title {
      font-size: 15px;
      font-weight: 600;
      color: #fafafa;
    }
    .export-actions {
      display: flex;
      gap: 8px;
    }
    .btn-export {
      background: #18181b;
      border: 1px solid #27272a;
      color: #d4d4d8;
      font-size: 12px;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-export:hover {
      background: #27272a;
      color: #fafafa;
    }
    .btn-export.primary {
      background: #fafafa;
      color: #09090b;
      border: none;
      font-weight: 600;
    }
    .btn-export.primary:hover {
      background: #e4e4e7;
    }

    .docs-split {
      display: grid;
      grid-template-columns: 280px 1fr;
      flex: 1;
      min-height: 0;
    }
    .endpoints-sidebar {
      border-right: 1px solid #27272a;
      background: #121215;
      display: flex;
      flex-direction: column;
      padding: 16px 0;
      overflow-y: auto;
    }
    .nav-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #71717a;
      font-weight: 600;
      padding: 0 16px 8px 16px;
    }
    .nav-list {
      display: flex;
      flex-direction: column;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 13px;
      color: #a1a1aa;
      border-left: 2px solid transparent;
    }
    .nav-item:hover {
      background: #18181b;
      color: #fafafa;
    }
    .nav-item.active {
      background: #18181b;
      color: #fafafa;
      border-left: 2px solid #fafafa;
    }
    .nav-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .detail-pane {
      padding: 24px 32px;
      overflow-y: auto;
    }
    .endpoint-doc {
      display: flex;
      flex-direction: column;
      gap: 18px;
      max-width: 800px;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .doc-req-name {
      font-size: 18px;
      font-weight: 600;
      color: #fafafa;
    }
    .url-box {
      background: #18181b;
      border: 1px solid #27272a;
      padding: 10px 14px;
      border-radius: 4px;
      font-family: var(--font-mono, monospace);
      font-size: 13px;
      color: #38bdf8;
    }
    .doc-description {
      font-size: 14px;
      color: #a1a1aa;
      line-height: 1.5;
    }
    .doc-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 6px;
    }
    .section-heading-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-heading {
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
      color: #71717a;
      margin: 0;
    }
    .btn-copy-sm {
      background: none;
      border: 1px solid #27272a;
      color: #a1a1aa;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 3px;
      cursor: pointer;
    }
    .btn-copy-sm:hover {
      background: #27272a;
      color: #fafafa;
    }
    .doc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .doc-table th {
      text-align: left;
      padding: 6px 10px;
      color: #71717a;
      font-weight: 500;
      font-size: 11px;
      text-transform: uppercase;
      border-bottom: 1px solid #27272a;
    }
    .doc-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #1f1f23;
    }
    .code-font {
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      color: #fafafa;
    }
    .code-font.muted {
      color: #71717a;
    }
    .code-snippet {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 4px;
      padding: 12px;
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      line-height: 1.45;
      color: #fafafa;
      overflow-x: auto;
      margin: 0;
    }
    .empty-docs-message {
      padding: 48px;
      text-align: center;
      color: #71717a;
      font-size: 14px;
    }
  `]
})
export class DocumentationViewComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly collection = input<Collection | null>(null);
  readonly requests = input<ApiRequestConfig[]>([]);
  readonly back = output<void>();

  readonly selectedRequest = signal<ApiRequestConfig | null>(null);

  constructor() {
    // Select first endpoint if available
    const reqs = this.requests();
    if (reqs.length > 0) {
      this.selectedRequest.set(reqs[0]);
    }
  }

  generateCurl(req: ApiRequestConfig): string {
    let curl = `curl -X ${req.method} '${req.url}'`;
    for (const h of req.headers.filter((h) => h.enabled)) {
      curl += ` \\\n  -H '${h.key}: ${h.value}'`;
    }
    if (req.auth.type === 'bearer' && req.auth.bearer?.token) {
      curl += ` \\\n  -H 'Authorization: Bearer ${req.auth.bearer.token}'`;
    } else if (req.auth.type === 'basic' && req.auth.basic?.username) {
      curl += ` \\\n  -u '${req.auth.basic.username}:${req.auth.basic.password || ''}'`;
    }
    if (req.body.mode === 'json' && req.body.raw) {
      curl += ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${req.body.raw.replace(/'/g, "\\'")}'`;
    }
    return curl;
  }

  copyCurl(): void {
    const req = this.selectedRequest();
    if (req) {
      const curl = this.generateCurl(req);
      navigator.clipboard.writeText(curl);
      this.toast.show('Copied cURL command', 'info');
    }
  }

  exportDoc(format: 'json' | 'markdown'): void {
    const col = this.collection();
    if (!col) return;

    this.api.getDocumentation(col._id, format).subscribe({
      next: (content) => {
        const ext = format === 'markdown' ? 'md' : 'json';
        const blob = new Blob([content], {
          type: format === 'markdown' ? 'text/markdown' : 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${col.name.toLowerCase().replace(/\s+/g, '-')}-docs.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        this.toast.show(`Exported ${format.toUpperCase()} documentation`, 'success');
      },
      error: () => {
        this.toast.show('Failed to export documentation', 'error');
      }
    });
  }
}
