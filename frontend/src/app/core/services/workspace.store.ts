import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import {
  Collection,
  Environment,
  HistoryEntry,
  Workspace,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  private api = inject(ApiService);

  // -- State signals --

  readonly workspaces = signal<Workspace[]>([]);
  readonly activeWorkspace = signal<Workspace | null>(null);
  readonly collections = signal<Collection[]>([]);
  readonly environments = signal<Environment[]>([]);
  readonly activeEnvironment = signal<Environment | null>(null);
  readonly history = signal<HistoryEntry[]>([]);

  readonly activeWorkspaceId = computed(() => this.activeWorkspace()?._id ?? null);

  // -- Initialization --

  async init(): Promise<void> {
    await this.loadWorkspaces();
    const list = this.workspaces();

    if (list.length > 0) {
      await this.switchWorkspace(list[0]._id);
    } else {
      const res = await firstValueFrom(
        this.api.createWorkspace('Default', 'Auto-created workspace'),
      );
      if (res.success) {
        this.workspaces.set([res.data]);
        await this.switchWorkspace(res.data._id);
      }
    }
  }

  // -- Workspaces --

  async loadWorkspaces(): Promise<void> {
    const res = await firstValueFrom(this.api.getWorkspaces());
    if (res.success) this.workspaces.set(res.data);
  }

  async switchWorkspace(workspaceId: string): Promise<void> {
    const ws = this.workspaces().find((w) => w._id === workspaceId) ?? null;
    this.activeWorkspace.set(ws);

    if (ws) {
      await Promise.all([
        this.loadCollections(),
        this.loadEnvironments(),
        this.loadHistory(),
      ]);
    }
  }

  // -- Collections --

  async loadCollections(): Promise<void> {
    const wsId = this.activeWorkspaceId();
    if (!wsId) return;
    const res = await firstValueFrom(this.api.getCollections(wsId));
    if (res.success) this.collections.set(res.data);
  }

  // -- Environments --

  async loadEnvironments(): Promise<void> {
    const wsId = this.activeWorkspaceId();
    if (!wsId) return;
    const res = await firstValueFrom(this.api.getEnvironments(wsId));
    if (res.success) {
      this.environments.set(res.data);
      // Restore active env if still present, otherwise clear
      const current = this.activeEnvironment();
      if (current) {
        const stillExists = res.data.find((e) => e._id === current._id);
        this.activeEnvironment.set(stillExists ?? null);
      }
    }
  }

  switchEnvironment(environmentId: string | null): void {
    if (!environmentId) {
      this.activeEnvironment.set(null);
      return;
    }
    const env = this.environments().find((e) => e._id === environmentId) ?? null;
    this.activeEnvironment.set(env);
  }

  // -- History --

  async loadHistory(method?: string, limit?: number): Promise<void> {
    const wsId = this.activeWorkspaceId();
    if (!wsId) return;
    const res = await firstValueFrom(this.api.getHistory(wsId, method, limit));
    if (res.success) this.history.set(res.data);
  }

  // -- Refresh helpers --

  async refreshAll(): Promise<void> {
    await this.loadWorkspaces();
    const wsId = this.activeWorkspaceId();
    if (wsId) {
      await Promise.all([
        this.loadCollections(),
        this.loadEnvironments(),
        this.loadHistory(),
      ]);
    }
  }
}
