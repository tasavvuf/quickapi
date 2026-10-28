import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tabs-bar">
      @for (tab of tabs(); track tab) {
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === tab"
          (click)="selectTab(tab)"
        >
          {{ tab }}
        </button>
      }
    </div>
  `,
  styles: [`
    .tabs-bar {
      display: flex;
      align-items: center;
      gap: 4px;
      border-bottom: 1px solid #27272a;
      background: transparent;
      padding: 0 4px;
    }
    .tab-btn {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: #71717a;
      font-size: 13px;
      font-weight: 500;
      padding: 8px 14px;
      cursor: pointer;
      transition: color 0.15s ease, border-color 0.15s ease;
      margin-bottom: -1px;
    }
    .tab-btn:hover {
      color: #d4d4d8;
    }
    .tab-btn.active {
      color: #fafafa;
      border-bottom: 2px solid #fafafa;
      font-weight: 600;
    }
  `]
})
export class TabsComponent {
  readonly tabs = input<string[]>([]);
  readonly activeTab = input<string>('');
  readonly tabChange = output<string>();

  selectTab(tab: string): void {
    this.tabChange.emit(tab);
  }
}
