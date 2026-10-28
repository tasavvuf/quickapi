import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div class="modal-container" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ title() }}</h3>
            <button type="button" class="btn-close" (click)="closeModal()" aria-label="Close">
              &times;
            </button>
          </div>
          <div class="modal-body">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }
    .modal-container {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 6px;
      width: 90%;
      max-width: 580px;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid #27272a;
    }
    .modal-title {
      font-size: 15px;
      font-weight: 600;
      color: #fafafa;
      margin: 0;
      letter-spacing: -0.2px;
    }
    .btn-close {
      background: none;
      border: none;
      color: #71717a;
      font-size: 20px;
      line-height: 1;
      padding: 2px 6px;
      cursor: pointer;
    }
    .btn-close:hover {
      color: #fafafa;
    }
    .modal-body {
      padding: 18px;
      overflow-y: auto;
    }
  `]
})
export class ModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('');
  readonly close = output<void>();

  closeModal(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    this.closeModal();
  }
}
