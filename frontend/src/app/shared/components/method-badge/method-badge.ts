import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpMethod } from '../../../core/models/api.models';

@Component({
  selector: 'app-method-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="'method-' + (method() || 'GET').toLowerCase()">
      {{ method() || 'GET' }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 7px;
      font-size: 11px;
      font-family: var(--font-mono, monospace);
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      border-radius: 3px;
      line-height: 1.2;
    }
    .method-get {
      background-color: #1e293b;
      color: #38bdf8;
      border: 1px solid #0369a1;
    }
    .method-post {
      background-color: #064e3b;
      color: #4ade80;
      border: 1px solid #059669;
    }
    .method-put {
      background-color: #451a03;
      color: #fbbf24;
      border: 1px solid #d97706;
    }
    .method-patch {
      background-color: #3b0764;
      color: #c084fc;
      border: 1px solid #7e22ce;
    }
    .method-delete {
      background-color: #450a0a;
      color: #f87171;
      border: 1px solid #dc2626;
    }
    .method-head, .method-options {
      background-color: #27272a;
      color: #a1a1aa;
      border: 1px solid #3f3f46;
    }
  `]
})
export class MethodBadgeComponent {
  readonly method = input<HttpMethod | string>('GET');
}
