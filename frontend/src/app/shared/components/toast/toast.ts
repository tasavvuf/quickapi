import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [ngClass]="'toast-' + toast.type">
          <span class="toast-text">{{ toast.message }}</span>
          <button type="button" class="btn-dismiss" (click)="toastService.dismiss(toast.id)">
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 2000;
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      font-size: 13px;
      border-radius: 4px;
      background: #18181b;
      border: 1px solid #27272a;
      color: #fafafa;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      min-width: 240px;
      max-width: 360px;
    }
    .toast-success {
      border-left: 3px solid #22c55e;
    }
    .toast-error {
      border-left: 3px solid #ef4444;
    }
    .toast-info {
      border-left: 3px solid #3b82f6;
    }
    .toast-text {
      flex: 1;
      line-height: 1.4;
    }
    .btn-dismiss {
      background: none;
      border: none;
      color: #71717a;
      font-size: 16px;
      cursor: pointer;
      padding: 0 4px;
    }
    .btn-dismiss:hover {
      color: #fafafa;
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
