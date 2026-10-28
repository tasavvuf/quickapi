import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkspaceStore } from '../../core/services/workspace.store';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Environment, EnvironmentVariable } from '../../core/models/api.models';
import { ModalComponent } from '../../shared/components/modal/modal';

@Component({
  selector: 'app-environments-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal [isOpen]="isOpen()" [title]="'Environment Variables'" (close)="close.emit()">
      <div class="env-modal-content">
        <!-- Environment selector / list -->
        <div class="env-tabs-bar">
          @for (env of store.environments(); track env._id) {
            <button
              type="button"
              class="env-tab-btn"
              [class.active]="selectedEnv()?._id === env._id"
              (click)="selectEnvironment(env)"
            >
              {{ env.name }}
            </button>
          }
          <button type="button" class="btn-new-env" (click)="isAddingEnv.set(true)">
            + New Environment
          </button>
        </div>

        @if (isAddingEnv()) {
          <div class="new-env-form">
            <input
              type="text"
              class="input-text"
              [(ngModel)]="newEnvName"
              placeholder="e.g. Production or Staging"
            />
            <button type="button" class="btn-sm-primary" (click)="createEnvironment()">Create</button>
            <button type="button" class="btn-sm-ghost" (click)="isAddingEnv.set(false)">Cancel</button>
          </div>
        }

        <!-- Active Environment Variables Editor -->
        @if (selectedEnv()) {
          <div class="env-editor-pane">
            <div class="env-header">
              <span class="env-title">{{ selectedEnv()!.name }}</span>
              <button type="button" class="btn-danger-xs" (click)="deleteSelectedEnv()">
                Delete Environment
              </button>
            </div>

            <table class="vars-table">
              <thead>
                <tr>
                  <th style="width: 32px;"></th>
                  <th>Variable Key</th>
                  <th>Value</th>
                  <th style="width: 70px;">Secret</th>
                  <th style="width: 32px;"></th>
                </tr>
              </thead>
              <tbody>
                @for (v of selectedEnv()!.variables; track $index) {
                  <tr>
                    <td>
                      <input
                        type="checkbox"
                        [(ngModel)]="v.enabled"
                        (ngModelChange)="hasChanges.set(true)"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        class="mono-input"
                        placeholder="e.g. baseUrl"
                        [(ngModel)]="v.key"
                        (ngModelChange)="hasChanges.set(true)"
                      />
                    </td>
                    <td>
                      <input
                        [type]="v.isSecret && !showSecrets() ? 'password' : 'text'"
                        class="mono-input"
                        placeholder="e.g. https://api.prod.com"
                        [(ngModel)]="v.value"
                        (ngModelChange)="hasChanges.set(true)"
                      />
                    </td>
                    <td style="text-align: center;">
                      <input
                        type="checkbox"
                        [(ngModel)]="v.isSecret"
                        (ngModelChange)="hasChanges.set(true)"
                      />
                    </td>
                    <td>
                      <button type="button" class="btn-del-var" (click)="removeVariable($index)">
                        &times;
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="env-actions-row">
              <button type="button" class="btn-sm-secondary" (click)="addVariable()">
                + Add Variable
              </button>
              <label class="toggle-secrets">
                <input
                  type="checkbox"
                  [checked]="showSecrets()"
                  (change)="showSecrets.set(!showSecrets())"
                />
                Show secret values
              </label>

              @if (hasChanges()) {
                <button type="button" class="btn-sm-primary ml-auto" (click)="saveVariables()">
                  Save Changes
                </button>
              }
            </div>
          </div>
        } @else if (store.environments().length === 0 && !isAddingEnv()) {
          <div class="empty-state">
            No environments created yet. Create an environment (e.g. Local or Staging) to define variables like {{ '{{baseUrl}}' }}.
          </div>
        }
      </div>
    </app-modal>
  `,
  styles: [`
    .env-modal-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .env-tabs-bar {
      display: flex;
      align-items: center;
      gap: 4px;
      border-bottom: 1px solid #27272a;
      padding-bottom: 8px;
      overflow-x: auto;
    }
    .env-tab-btn {
      background: #18181b;
      border: 1px solid #27272a;
      color: #a1a1aa;
      font-size: 12px;
      padding: 5px 12px;
      border-radius: 4px;
      cursor: pointer;
    }
    .env-tab-btn:hover {
      background: #27272a;
      color: #fafafa;
    }
    .env-tab-btn.active {
      background: #27272a;
      color: #fafafa;
      border-color: #52525b;
      font-weight: 600;
    }
    .btn-new-env {
      background: none;
      border: 1px dashed #3f3f46;
      color: #71717a;
      font-size: 12px;
      padding: 5px 10px;
      border-radius: 4px;
      cursor: pointer;
    }
    .btn-new-env:hover {
      color: #fafafa;
      border-color: #52525b;
    }
    .new-env-form {
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 8px 0;
    }
    .input-text {
      background: #18181b;
      border: 1px solid #27272a;
      color: #fafafa;
      font-size: 13px;
      padding: 6px 10px;
      border-radius: 3px;
      flex: 1;
    }
    .env-editor-pane {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .env-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .env-title {
      font-size: 14px;
      font-weight: 600;
      color: #fafafa;
    }
    .btn-danger-xs {
      background: none;
      border: none;
      color: #71717a;
      font-size: 12px;
      cursor: pointer;
    }
    .btn-danger-xs:hover {
      color: #ef4444;
    }
    .vars-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .vars-table th {
      text-align: left;
      padding: 6px 8px;
      color: #71717a;
      font-weight: 500;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #27272a;
    }
    .vars-table td {
      padding: 4px 6px;
      border-bottom: 1px solid #1f1f23;
    }
    .mono-input {
      width: 100%;
      background: #18181b;
      border: 1px solid #27272a;
      color: #fafafa;
      font-family: var(--font-mono, monospace);
      font-size: 12px;
      padding: 5px 8px;
      border-radius: 3px;
    }
    .mono-input:focus {
      border-color: #52525b;
      outline: none;
    }
    .btn-del-var {
      background: none;
      border: none;
      color: #71717a;
      font-size: 16px;
      cursor: pointer;
    }
    .btn-del-var:hover {
      color: #ef4444;
    }
    .env-actions-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 6px;
    }
    .toggle-secrets {
      font-size: 12px;
      color: #71717a;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }
    .ml-auto {
      margin-left: auto;
    }
    .btn-sm-primary {
      background: #fafafa;
      color: #09090b;
      border: none;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 3px;
      cursor: pointer;
    }
    .btn-sm-secondary {
      background: #27272a;
      color: #fafafa;
      border: 1px solid #3f3f46;
      font-size: 12px;
      padding: 5px 12px;
      border-radius: 3px;
      cursor: pointer;
    }
    .btn-sm-ghost {
      background: none;
      border: none;
      color: #71717a;
      font-size: 12px;
      padding: 5px 10px;
      cursor: pointer;
    }
    .empty-state {
      padding: 24px 0;
      text-align: center;
      color: #71717a;
      font-size: 13px;
    }
  `]
})
export class EnvironmentsModalComponent {
  readonly store = inject(WorkspaceStore);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly isOpen = input<boolean>(false);
  readonly close = output<void>();

  readonly selectedEnv = signal<Environment | null>(null);
  readonly isAddingEnv = signal<boolean>(false);
  readonly showSecrets = signal<boolean>(false);
  readonly hasChanges = signal<boolean>(false);

  newEnvName = '';

  constructor() {
    // Select first environment by default if available
    const envs = this.store.environments();
    if (envs.length > 0) {
      this.selectedEnv.set({ ...envs[0] });
    }
  }

  selectEnvironment(env: Environment): void {
    this.selectedEnv.set(JSON.parse(JSON.stringify(env)));
    this.hasChanges.set(false);
  }

  createEnvironment(): void {
    if (!this.newEnvName.trim()) return;
    const wsId = this.store.activeWorkspaceId();
    if (!wsId) return;

    this.api.createEnvironment({
      name: this.newEnvName.trim(),
      workspaceId: wsId,
      variables: [
        { key: 'baseUrl', value: 'https://jsonplaceholder.typicode.com', isSecret: false, enabled: true }
      ]
    }).subscribe((res) => {
      if (res.success) {
        this.store.loadEnvironments().then(() => {
          this.selectedEnv.set(res.data);
          this.newEnvName = '';
          this.isAddingEnv.set(false);
          this.toast.show('Environment created', 'success');
        });
      }
    });
  }

  deleteSelectedEnv(): void {
    const env = this.selectedEnv();
    if (!env || !confirm(`Delete environment ${env.name}?`)) return;

    this.api.deleteEnvironment(env._id).subscribe((res) => {
      if (res.success) {
        this.store.loadEnvironments().then(() => {
          const list = this.store.environments();
          this.selectedEnv.set(list.length > 0 ? { ...list[0] } : null);
          this.toast.show('Environment deleted', 'info');
        });
      }
    });
  }

  addVariable(): void {
    const env = this.selectedEnv();
    if (!env) return;
    env.variables.push({ key: '', value: '', isSecret: false, enabled: true });
    this.selectedEnv.set({ ...env });
    this.hasChanges.set(true);
  }

  removeVariable(index: number): void {
    const env = this.selectedEnv();
    if (!env) return;
    env.variables.splice(index, 1);
    this.selectedEnv.set({ ...env });
    this.hasChanges.set(true);
  }

  saveVariables(): void {
    const env = this.selectedEnv();
    if (!env) return;

    this.api.updateEnvironment(env._id, { variables: env.variables }).subscribe((res) => {
      if (res.success) {
        this.store.loadEnvironments();
        this.hasChanges.set(false);
        this.toast.show('Environment variables saved', 'success');
      }
    });
  }
}
