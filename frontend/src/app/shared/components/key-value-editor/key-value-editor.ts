import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeyValue } from '../../../core/models/api.models';

@Component({
  selector: 'app-key-value-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="kv-container">
      @if (items().length === 0) {
        <div class="empty-state">No parameters configured. Click below to add one.</div>
      } @else {
        <table class="kv-table">
          <thead>
            <tr>
              <th style="width: 36px;"></th>
              <th>Key</th>
              <th>Value</th>
              <th style="width: 36px;"></th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track $index) {
              <tr>
                <td class="checkbox-cell">
                  <input
                    type="checkbox"
                    [checked]="item.enabled"
                    (change)="toggleEnabled($index)"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    class="mono-input"
                    [placeholder]="keyPlaceholder()"
                    [ngModel]="item.key"
                    (ngModelChange)="updateKey($index, $event)"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    class="mono-input"
                    [placeholder]="valuePlaceholder()"
                    [ngModel]="item.value"
                    (ngModelChange)="updateValue($index, $event)"
                  />
                </td>
                <td class="action-cell">
                  <button type="button" class="btn-remove" (click)="removeItem($index)" title="Remove item">
                    &times;
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
      <div class="footer-actions">
        <button type="button" class="btn-add" (click)="addItem()">
          + Add Parameter
        </button>
      </div>
    </div>
  `,
  styles: [`
    .kv-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }
    .empty-state {
      padding: 18px 12px;
      color: #71717a;
      font-size: 13px;
      border: 1px dashed #27272a;
      border-radius: 4px;
      text-align: center;
    }
    .kv-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .kv-table th {
      text-align: left;
      padding: 6px 8px;
      font-weight: 500;
      color: #71717a;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #27272a;
    }
    .kv-table td {
      padding: 4px 6px;
      border-bottom: 1px solid #1f1f23;
    }
    .checkbox-cell, .action-cell {
      text-align: center;
      vertical-align: middle;
    }
    input[type="checkbox"] {
      cursor: pointer;
      accent-color: #fafafa;
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
    .btn-remove {
      background: none;
      border: none;
      color: #71717a;
      font-size: 16px;
      line-height: 1;
      padding: 4px;
      cursor: pointer;
    }
    .btn-remove:hover {
      color: #ef4444;
    }
    .footer-actions {
      padding-top: 4px;
    }
    .btn-add {
      background: none;
      border: 1px dashed #3f3f46;
      color: #a1a1aa;
      font-size: 12px;
      padding: 5px 12px;
      border-radius: 3px;
      cursor: pointer;
    }
    .btn-add:hover {
      background: #27272a;
      color: #fafafa;
      border-color: #52525b;
    }
  `]
})
export class KeyValueEditorComponent {
  readonly items = input<KeyValue[]>([]);
  readonly keyPlaceholder = input<string>('Key');
  readonly valuePlaceholder = input<string>('Value');
  readonly itemsChange = output<KeyValue[]>();

  toggleEnabled(index: number): void {
    const updated = this.items().map((item, i) =>
      i === index ? { ...item, enabled: !item.enabled } : item
    );
    this.itemsChange.emit(updated);
  }

  updateKey(index: number, newKey: string): void {
    const updated = this.items().map((item, i) =>
      i === index ? { ...item, key: newKey } : item
    );
    this.itemsChange.emit(updated);
  }

  updateValue(index: number, newValue: string): void {
    const updated = this.items().map((item, i) =>
      i === index ? { ...item, value: newValue } : item
    );
    this.itemsChange.emit(updated);
  }

  removeItem(index: number): void {
    const updated = this.items().filter((_, i) => i !== index);
    this.itemsChange.emit(updated);
  }

  addItem(): void {
    const updated = [...this.items(), { key: '', value: '', enabled: true }];
    this.itemsChange.emit(updated);
  }
}
