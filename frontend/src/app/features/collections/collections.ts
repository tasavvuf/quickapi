import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { WorkspaceStore } from '../../core/services/workspace.store';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Collection, ApiRequestConfig } from '../../core/models/api.models';
import { MethodBadgeComponent } from '../../shared/components/method-badge/method-badge';

@Component({
  selector: 'app-collections',
  standalone: true,
  imports: [CommonModule, FormsModule, MethodBadgeComponent],
  template: `
    <div class="collections-container">
      <div class="header-row">
        <span class="section-title">Collections</span>
        <button type="button" class="btn-icon" (click)="isCreating.set(true)" title="New collection">
          + New
        </button>
      </div>

      @if (isCreating()) {
        <div class="new-collection-card">
          <input
            type="text"
            [(ngModel)]="newColName"
            placeholder="Collection name"
            class="input-col"
            (keydown.enter)="saveNewCollection()"
            (keydown.escape)="isCreating.set(false)"
          />
          <div class="card-actions">
            <button type="button" class="btn-xs-primary" (click)="saveNewCollection()">Create</button>
            <button type="button" class="btn-xs-ghost" (click)="isCreating.set(false)">Cancel</button>
          </div>
        </div>
      }

      <div class="collections-list">
        @if (store.collections().length === 0 && !isCreating()) {
          <div class="empty-state">
            No collections yet. Group requests into collections to organize and auto-generate docs.
          </div>
        }

        @for (col of store.collections(); track col._id) {
          <div class="collection-item">
            <div class="col-header" (click)="toggleExpand(col._id)">
              <span class="col-expand-icon">{{ isExpanded(col._id) ? '▾' : '▸' }}</span>
              <span class="col-name">{{ col.name }}</span>
              <div class="col-actions" (click)="$event.stopPropagation()">
                <button
                  type="button"
                  class="btn-icon-xs"
                  (click)="onOpenDocs.emit(col._id)"
                  title="View Auto-Docs"
                >
                  Docs
                </button>
                <button
                  type="button"
                  class="btn-icon-xs"
                  (click)="addNewRequestToCol(col._id)"
                  title="Add request"
                >
                  +
                </button>
                <button
                  type="button"
                  class="btn-icon-xs danger"
                  (click)="deleteCol(col._id)"
                  title="Delete collection"
                >
                  &times;
                </button>
              </div>
            </div>

            @if (isExpanded(col._id)) {
              <div class="requests-list">
                @for (req of getRequestsForCol(col._id); track req._id) {
                  <div
                    class="request-row"
                    [class.active]="activeRequestId() === req._id"
                    (click)="onSelectRequest.emit(req)"
                  >
                    <app-method-badge [method]="req.method" />
                    <span class="req-name" title="{{ req.name }}">{{ req.name }}</span>
                    <button
                      type="button"
                      class="btn-del-req"
                      (click)="deleteReq(req._id!, $event)"
                      title="Delete request"
                    >
                      &times;
                    </button>
                  </div>
                }
                @if (getRequestsForCol(col._id).length === 0) {
                  <div class="empty-requests">No endpoints in collection.</div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .collections-container {
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
    .btn-icon {
      background: #18181b;
      border: 1px solid #27272a;
      color: #a1a1aa;
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 3px;
      cursor: pointer;
    }
    .btn-icon:hover {
      background: #27272a;
      color: #fafafa;
    }
    .new-collection-card {
      padding: 10px 14px;
      background: #121215;
      border-bottom: 1px solid #27272a;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .input-col {
      width: 100%;
      background: #18181b;
      border: 1px solid #27272a;
      color: #fafafa;
      font-size: 12px;
      padding: 5px 8px;
      border-radius: 3px;
    }
    .card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
    }
    .btn-xs-primary {
      background: #fafafa;
      color: #09090b;
      border: none;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 3px;
      cursor: pointer;
    }
    .btn-xs-ghost {
      background: none;
      border: none;
      color: #71717a;
      font-size: 11px;
      padding: 3px 6px;
      cursor: pointer;
    }
    .btn-xs-ghost:hover {
      color: #fafafa;
    }
    .collections-list {
      flex: 1;
      overflow-y: auto;
      padding: 6px 0;
    }
    .empty-state {
      padding: 20px 14px;
      color: #71717a;
      font-size: 12px;
      line-height: 1.4;
      text-align: center;
    }
    .collection-item {
      display: flex;
      flex-direction: column;
    }
    .col-header {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      cursor: pointer;
      font-size: 13px;
      color: #d4d4d8;
      user-select: none;
      gap: 6px;
    }
    .col-header:hover {
      background: #18181b;
      color: #fafafa;
    }
    .col-expand-icon {
      font-size: 10px;
      color: #71717a;
      width: 12px;
    }
    .col-name {
      flex: 1;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .col-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: 0.6;
    }
    .col-header:hover .col-actions {
      opacity: 1;
    }
    .btn-icon-xs {
      background: none;
      border: none;
      color: #a1a1aa;
      font-size: 11px;
      padding: 2px 4px;
      cursor: pointer;
      border-radius: 2px;
    }
    .btn-icon-xs:hover {
      background: #27272a;
      color: #fafafa;
    }
    .btn-icon-xs.danger:hover {
      color: #ef4444;
    }

    .requests-list {
      display: flex;
      flex-direction: column;
      padding-left: 12px;
      background: #09090b;
    }
    .request-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 12px;
      cursor: pointer;
      font-size: 12px;
      border-left: 2px solid transparent;
    }
    .request-row:hover {
      background: #18181b;
    }
    .request-row.active {
      background: #18181b;
      border-left: 2px solid #fafafa;
    }
    .req-name {
      flex: 1;
      color: #d4d4d8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .btn-del-req {
      background: none;
      border: none;
      color: #71717a;
      font-size: 14px;
      cursor: pointer;
      opacity: 0;
      padding: 0 4px;
    }
    .request-row:hover .btn-del-req {
      opacity: 1;
    }
    .btn-del-req:hover {
      color: #ef4444;
    }
    .empty-requests {
      padding: 6px 12px;
      font-size: 11px;
      color: #52525b;
    }
  `]
})
export class CollectionsComponent {
  readonly store = inject(WorkspaceStore);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly activeRequestId = input<string | null>(null);
  readonly onSelectRequest = output<ApiRequestConfig>();
  readonly onOpenDocs = output<string>();

  readonly isCreating = signal<boolean>(false);
  newColName = '';

  private expandedCols = signal<Set<string>>(new Set());
  private collectionRequests = signal<Map<string, ApiRequestConfig[]>>(new Map());

  constructor() {
    this.refreshRequests();
  }

  isExpanded(colId: string): boolean {
    return this.expandedCols().has(colId);
  }

  toggleExpand(colId: string): void {
    const next = new Set(this.expandedCols());
    if (next.has(colId)) {
      next.delete(colId);
    } else {
      next.add(colId);
      this.loadRequestsForCollection(colId);
    }
    this.expandedCols.set(next);
  }

  async refreshRequests(): Promise<void> {
    const wsId = this.store.activeWorkspaceId();
    if (!wsId) return;
    this.api.getRequests(undefined, wsId).subscribe((res) => {
      if (res.success) {
        const map = new Map<string, ApiRequestConfig[]>();
        for (const req of res.data) {
          if (req.collectionId) {
            const list = map.get(req.collectionId) || [];
            list.push(req);
            map.set(req.collectionId, list);
          }
        }
        this.collectionRequests.set(map);
      }
    });
  }

  loadRequestsForCollection(colId: string): void {
    this.api.getRequests(colId).subscribe((res) => {
      if (res.success) {
        const map = new Map(this.collectionRequests());
        map.set(colId, res.data);
        this.collectionRequests.set(map);
      }
    });
  }

  getRequestsForCol(colId: string): ApiRequestConfig[] {
    return this.collectionRequests().get(colId) || [];
  }

  saveNewCollection(): void {
    if (!this.newColName.trim()) return;
    const wsId = this.store.activeWorkspaceId();
    if (!wsId) return;

    this.api.createCollection({ name: this.newColName.trim(), workspaceId: wsId }).subscribe((res) => {
      if (res.success) {
        this.store.loadCollections();
        this.newColName = '';
        this.isCreating.set(false);
        this.toast.show('Collection created', 'success');
      }
    });
  }

  deleteCol(colId: string): void {
    if (!confirm('Delete this collection and its endpoints?')) return;
    this.api.deleteCollection(colId).subscribe((res) => {
      if (res.success) {
        this.store.loadCollections();
        this.toast.show('Collection deleted', 'info');
      }
    });
  }

  addNewRequestToCol(colId: string): void {
    const wsId = this.store.activeWorkspaceId();
    const newReq: Partial<ApiRequestConfig> = {
      name: 'New Request',
      method: 'GET',
      url: '',
      collectionId: colId,
      workspaceId: wsId || undefined,
      headers: [],
      queryParams: [],
      auth: { type: 'none' },
      body: { mode: 'none' }
    };

    this.api.createRequest(newReq).subscribe((res) => {
      if (res.success) {
        this.loadRequestsForCollection(colId);
        this.onSelectRequest.emit(res.data);
        this.toast.show('Request added to collection', 'success');
      }
    });
  }

  deleteReq(reqId: string, event: MouseEvent): void {
    event.stopPropagation();
    if (!confirm('Delete this endpoint?')) return;
    this.api.deleteRequest(reqId).subscribe((res) => {
      if (res.success) {
        this.refreshRequests();
        this.toast.show('Request deleted', 'info');
      }
    });
  }
}
