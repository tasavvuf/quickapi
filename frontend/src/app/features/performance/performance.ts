import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { WorkspaceStore } from '../../core/services/workspace.store';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ApiRequestConfig, BenchmarkResult } from '../../core/models/api.models';
import { ModalComponent } from '../../shared/components/modal/modal';

@Component({
  selector: 'app-performance-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal [isOpen]="isOpen()" [title]="'Performance Benchmark'" (close)="close.emit()">
      <div class="perf-modal-content">
        <div class="endpoint-summary">
          <span class="method-tag">{{ request()?.method }}</span>
          <span class="url-text">{{ request()?.url }}</span>
        </div>

        <!-- Controls -->
        <div class="controls-row">
          <div class="control-field">
            <label class="control-label">Iterations</label>
            <input
              type="number"
              class="num-input"
              [(ngModel)]="iterations"
              min="5"
              max="100"
              [disabled]="isRunning()"
            />
          </div>
          <div class="control-field">
            <label class="control-label">Concurrency</label>
            <input
              type="number"
              class="num-input"
              [(ngModel)]="concurrency"
              min="1"
              max="10"
              [disabled]="isRunning()"
            />
          </div>
          <button
            type="button"
            class="btn-run"
            [disabled]="isRunning()"
            (click)="startBenchmark()"
          >
            {{ isRunning() ? 'Running Tests...' : 'Run Benchmark' }}
          </button>
        </div>

        <!-- Progress or Results -->
        @if (isRunning()) {
          <div class="running-state">
            <div class="spinner-text">Executing {{ iterations }} requests (concurrency: {{ concurrency }})...</div>
          </div>
        } @else if (result()) {
          <div class="results-container">
            <!-- Metric Cards -->
            <div class="stats-grid">
              <div class="stat-card">
                <span class="stat-label">Min Latency</span>
                <span class="stat-val">{{ result()!.stats.min }} ms</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Average (Mean)</span>
                <span class="stat-val highlight">{{ result()!.stats.mean }} ms</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Median (P50)</span>
                <span class="stat-val">{{ result()!.stats.median }} ms</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">P95 Latency</span>
                <span class="stat-val highlight-amber">{{ result()!.stats.p95 }} ms</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Max Latency</span>
                <span class="stat-val">{{ result()!.stats.max }} ms</span>
              </div>
              <div class="stat-card">
                <span class="stat-label">Throughput</span>
                <span class="stat-val">{{ result()!.throughput }} req/s</span>
              </div>
            </div>

            <!-- Health & Counts -->
            <div class="status-summary">
              <span class="status-chip success">Successful: {{ result()!.successCount }}</span>
              <span class="status-chip" [class.danger]="result()!.errorCount > 0">
                Failed: {{ result()!.errorCount }}
              </span>
              <span class="status-chip muted">
                Total Wall Time: {{ result()!.totalDuration }} ms
              </span>
            </div>

            <!-- Latencies List -->
            <div class="latencies-section">
              <div class="section-title">Individual Request Timings</div>
              <div class="timings-list">
                @for (lat of result()!.latencies; track $index) {
                  <div class="timing-badge">
                    #{{ $index + 1 }}: {{ lat }}ms
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </app-modal>
  `,
  styles: [`
    .perf-modal-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .endpoint-summary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 4px;
      font-family: var(--font-mono, monospace);
      font-size: 12px;
    }
    .method-tag {
      font-weight: 700;
      color: #38bdf8;
    }
    .url-text {
      color: #fafafa;
      word-break: break-all;
    }
    .controls-row {
      display: flex;
      align-items: flex-end;
      gap: 12px;
    }
    .control-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .control-label {
      font-size: 11px;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }
    .num-input {
      width: 90px;
      background: #18181b;
      border: 1px solid #27272a;
      color: #fafafa;
      font-size: 13px;
      padding: 6px 10px;
      border-radius: 3px;
    }
    .btn-run {
      background: #fafafa;
      color: #09090b;
      border: none;
      font-size: 13px;
      font-weight: 600;
      padding: 7px 16px;
      border-radius: 3px;
      cursor: pointer;
    }
    .btn-run:hover:not(:disabled) {
      background: #e4e4e7;
    }
    .btn-run:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .running-state {
      padding: 32px;
      text-align: center;
      color: #a1a1aa;
      font-family: var(--font-mono, monospace);
      font-size: 13px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .stat-card {
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 4px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-label {
      font-size: 11px;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-val {
      font-family: var(--font-mono, monospace);
      font-size: 16px;
      font-weight: 600;
      color: #fafafa;
    }
    .stat-val.highlight {
      color: #38bdf8;
    }
    .stat-val.highlight-amber {
      color: #fbbf24;
    }
    .status-summary {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
    .status-chip {
      font-size: 12px;
      font-family: var(--font-mono, monospace);
      padding: 4px 8px;
      border-radius: 3px;
      background: #18181b;
      border: 1px solid #27272a;
    }
    .status-chip.success {
      color: #4ade80;
      border-color: #059669;
    }
    .status-chip.danger {
      color: #f87171;
      border-color: #dc2626;
    }
    .status-chip.muted {
      color: #a1a1aa;
    }
    .latencies-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .section-title {
      font-size: 11px;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .timings-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-height: 120px;
      overflow-y: auto;
      padding: 4px 0;
    }
    .timing-badge {
      font-family: var(--font-mono, monospace);
      font-size: 11px;
      background: #18181b;
      border: 1px solid #27272a;
      color: #d4d4d8;
      padding: 2px 6px;
      border-radius: 3px;
    }
  `]
})
export class PerformanceModalComponent {
  private api = inject(ApiService);
  private store = inject(WorkspaceStore);
  private toast = inject(ToastService);

  readonly isOpen = input<boolean>(false);
  readonly request = input<ApiRequestConfig | null>(null);
  readonly close = output<void>();

  iterations = 10;
  concurrency = 2;
  readonly isRunning = signal<boolean>(false);
  readonly result = signal<BenchmarkResult | null>(null);

  startBenchmark(): void {
    const req = this.request();
    if (!req || !req.url) {
      this.toast.show('Please provide a valid request URL', 'error');
      return;
    }

    this.isRunning.set(true);
    this.result.set(null);

    const envId = this.store.activeEnvironment()?._id;

    this.api.runBenchmark(req, envId, this.iterations, this.concurrency).subscribe({
      next: (res) => {
        this.isRunning.set(false);
        if (res.success) {
          this.result.set(res.data);
          this.toast.show('Benchmark finished', 'success');
        } else {
          this.toast.show(res.error || 'Benchmark failed', 'error');
        }
      },
      error: (err) => {
        this.isRunning.set(false);
        this.toast.show(err.message || 'Benchmark error', 'error');
      }
    });
  }
}
