import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceStore } from './core/services/workspace.store';
import { ApiService } from './core/services/api.service';
import { ToastService } from './shared/components/toast/toast.service';
import {
  ApiRequestConfig,
  Collection,
  Environment
} from './core/models/api.models';
import { RequestRunnerComponent } from './features/request-runner/request-runner';
import { CollectionsComponent } from './features/collections/collections';
import { HistoryComponent } from './features/history/history';
import { EnvironmentsModalComponent } from './features/environments/environments';
import { PerformanceModalComponent } from './features/performance/performance';
import { DocumentationViewComponent } from './features/documentation/documentation';
import { CommentsDrawerComponent } from './features/collaboration/comments';
import { ModalComponent } from './shared/components/modal/modal';
import { ToastComponent } from './shared/components/toast/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RequestRunnerComponent,
    CollectionsComponent,
    HistoryComponent,
    EnvironmentsModalComponent,
    PerformanceModalComponent,
    DocumentationViewComponent,
    CommentsDrawerComponent,
    ModalComponent,
    ToastComponent,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit {
  readonly store = inject(WorkspaceStore);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly sidebarTab = signal<'collections' | 'history'>('collections');
  readonly currentView = signal<'runner' | 'docs'>('runner');

  // Active request being tested
  readonly currentRequest = signal<ApiRequestConfig>({
    name: 'New Request',
    description: '',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    headers: [
      { key: 'Accept', value: 'application/json', enabled: true }
    ],
    queryParams: [],
    auth: { type: 'none' },
    body: { mode: 'none' }
  });

  // Modals state
  readonly isEnvModalOpen = signal<boolean>(false);
  readonly isPerfModalOpen = signal<boolean>(false);
  readonly isCommentsOpen = signal<boolean>(false);
  readonly isSaveModalOpen = signal<boolean>(false);

  // Active collection for documentation view
  readonly docCollection = signal<Collection | null>(null);
  readonly docRequests = signal<ApiRequestConfig[]>([]);

  // Save request modal fields
  saveRequestName = '';
  saveTargetColId = '';

  async ngOnInit(): Promise<void> {
    await this.store.init();
  }

  onSelectRequest(req: ApiRequestConfig): void {
    this.currentRequest.set({ ...req });
    this.currentView.set('runner');
  }

  onReplayRequest(partialReq: Partial<ApiRequestConfig>): void {
    this.currentRequest.update((curr) => ({
      ...curr,
      ...partialReq,
      name: partialReq.name || curr.name,
      method: partialReq.method || curr.method,
      url: partialReq.url || curr.url,
      headers: partialReq.headers || curr.headers,
      queryParams: partialReq.queryParams || curr.queryParams,
      body: partialReq.body || curr.body,
    }));
    this.currentView.set('runner');
  }

  openDocumentation(colId: string): void {
    const col = this.store.collections().find((c) => c._id === colId) || null;
    this.docCollection.set(col);

    this.api.getRequests(colId).subscribe((res) => {
      if (res.success) {
        this.docRequests.set(res.data);
        this.currentView.set('docs');
      }
    });
  }

  openSaveModal(req: ApiRequestConfig): void {
    this.saveRequestName = req.name || 'Untitled Request';
    const cols = this.store.collections();
    if (cols.length > 0) {
      this.saveTargetColId = req.collectionId || cols[0]._id;
    }
    this.isSaveModalOpen.set(true);
  }

  confirmSaveRequest(): void {
    if (!this.saveTargetColId) {
      this.toast.show('Please create or select a collection first', 'error');
      return;
    }

    const wsId = this.store.activeWorkspaceId();
    const reqData: Partial<ApiRequestConfig> = {
      ...this.currentRequest(),
      name: this.saveRequestName.trim() || 'Untitled Request',
      collectionId: this.saveTargetColId,
      workspaceId: wsId || undefined,
    };

    if (this.currentRequest()._id) {
      // Update existing request
      this.api.updateRequest(this.currentRequest()._id!, reqData).subscribe((res) => {
        if (res.success) {
          this.currentRequest.set(res.data);
          this.isSaveModalOpen.set(false);
          this.toast.show('Request updated successfully', 'success');
        }
      });
    } else {
      // Create new request
      this.api.createRequest(reqData).subscribe((res) => {
        if (res.success) {
          this.currentRequest.set(res.data);
          this.isSaveModalOpen.set(false);
          this.toast.show('Request saved to collection', 'success');
        }
      });
    }
  }

  onEnvironmentChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const envId = select.value === '' ? null : select.value;
    this.store.switchEnvironment(envId);
  }
}
