import { Component, inject, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceStore } from '../../core/services/workspace.store';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { HistoryEntry, ApiRequestConfig } from '../../core/models/api.models';
import { MethodBadgeComponent } from '../../shared/components/method-badge/method-badge';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, MethodBadgeComponent],
  template: `
    <div class="history-container">
      <div class="header-row">
        <span class="section-title">Request History</span>
        @if (store.history().length > 0) {
          <button type="button" class="btn-clear" (click)="clearAllHistory()">
            Clear
          </button>
        }
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <input
          type="text"
          class="search-input"
          placeholder="Filter URL..."
          [(ngModel)]="searchQuery"
        />
        <select class="method-filter" [(ngModel)]="methodFilter">
          <option value="ALL">ALL</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      <div class="history-list">
        @if (filteredHistory().length === 0) {
          <div class="empty-state">
            No executed requests recorded in history.
          </div>
        }

        @for (entry of filteredHistory(); track entry._id) {
          <div class="history-item" (click)="replayRequest(entry)">
            <div class="item-top">
              <app-method-badge [method]="entry.method" />
              <span class="item-status" [ngClass]="getStatusClass(entry.responseStatus)">
                {{ entry.responseStatus }}
              </span>
              <span class="item-time">{{ entry.duration }}ms</span>
            </div>
            <div class="item-url" title="{{ entry.url }}">
              {{ entry.url }}
            </div>
            <div class="item-bottom">
              <span class="item-date">{{ formatTimestamp(entry.createdAt) }}</span>
              <button
                type="button"
                class="btn-del"
                (click)="deleteEntry(entry._id, $event)"
                title="Remove entry"
              >
                &times;
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .history-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-bottom: 1px solid #27272a;
    }
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
      color: #71717a;
    }
    .btn-clear {
      background: none;
      border: none;
      color: #71717a;
      font-size: 11px;
      cursor: pointer;
      padding: 2px 6px;
    }
    .btn-clear:hover {
      color: #ef4444;
    }
    .filter-bar {
      display: flex;
      gap: 6px;
      padding: 8px 12px;
      border-bottom: 1px solid #27272a;
    }
    .search-input {
      flex: 1;
      background: #18181b;
      border: 1px solid #27272a;
      color: #fafafa;
      font-size: 11px;
      padding: 4px 6px;
      border-radius: 3px;
    }
    .method-filter {
      background: #18181b;
      border: 1px solid #27272a;
      color: #a1a1aa;
      font-size: 11px;
      padding: 4px;
      border-radius: 3px;
      cursor: pointer;
    }
    .history-list {
      flex: 1;
      overflow-y: auto;
      padding: 6px 0;
    }
    .empty-state {
      padding: 24px 14px;
      color: #71717a;
      font-size: 12px;
      text-align: center;
    }
    .history-item {
      padding: 8px 12px;
      border-bottom: 1px solid #1f1f23;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .history-item:hover {
      background: #18181b;
    }
    .item-top {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .item-status {
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      font-weight: 600;
    }
    .status-ok { color: #4ade80; }
    .status-err { color: #f87171; }
    .status-warn { color: #fbbf24; }
    .item-time {
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      color: #71717a;
      margin-left: auto;
    }
    .item-url {
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      color: #d4d4d8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .item-date {
      font-size: 10px;
      color: #52525b;
    }
    .btn-del {
      background: none;
      border: none;
      color: #52525b;
      font-size: 14px;
      cursor: pointer;
      line-height: 1;
    }
    .btn-del:hover {
      color: #ef4444;
    }
  `]
})
export class HistoryComponent {
  readonly store = inject(WorkspaceStore);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly onReplay = output<Partial<ApiRequestConfig>>();

  searchQuery = '';
  methodFilter = 'ALL';

  filteredHistory = computed(() => {
    let list = this.store.history();
    if (this.methodFilter !== 'ALL') {
      list = list.filter((e) => e.method === this.methodFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter((e) => e.url.toLowerCase().includes(q));
    }
    return list;
  });

  getStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'status-ok';
    if (status >= 400) return 'status-err';
    return 'status-warn';
  }

  formatTimestamp(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  }

  replayRequest(entry: HistoryEntry): void {
    const headersList = Object.entries(entry.requestHeaders || {}).map(([key, value]) => ({
      key,
      value,
      enabled: true
    }));

    const req: Partial<ApiRequestConfig> = {
      name: `Replay: ${entry.url}`,
      method: entry.method,
      url: entry.url,
      headers: headersList,
      queryParams: [],
      auth: { type: 'none' },
      body: {
        mode: entry.requestBody ? 'json' : 'none',
        raw: entry.requestBody || undefined
      }
    };
    this.onReplay.emit(req);
    this.toast.show('Loaded request into editor', 'info');
  }

  deleteEntry(id: string, event: MouseEvent): void {
    event.stopPropagation();
    this.api.deleteHistory(id).subscribe((res) => {
      if (res.success) {
        this.store.loadHistory();
      }
    });
  }

  clearAllHistory(): void {
    const wsId = this.store.activeWorkspaceId();
    if (!wsId) return;
    this.api.clearHistory(wsId).subscribe((res) => {
      if (res.success) {
        this.store.loadHistory();
        this.toast.show('History cleared', 'info');
      }
    });
  }
}
