import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { WorkspaceStore } from '../../core/services/workspace.store';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Comment, ApiRequestConfig } from '../../core/models/api.models';

@Component({
  selector: 'app-comments-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="drawer-overlay" (click)="close.emit()">
        <div class="drawer-panel" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <div>
              <h3 class="drawer-title">Endpoint Comments</h3>
              <div class="drawer-subtitle">{{ request()?.name || 'Current Request' }}</div>
            </div>
            <button type="button" class="btn-close" (click)="close.emit()">&times;</button>
          </div>

          <!-- New Comment Box -->
          <div class="new-comment-box">
            <input
              type="text"
              class="author-input"
              [(ngModel)]="authorName"
              placeholder="Your name or handle"
            />
            <textarea
              class="comment-textarea"
              rows="3"
              [(ngModel)]="newCommentText"
              placeholder="Add a comment, bug note, or parameter tip..."
              (keydown.ctrl.enter)="postComment()"
            ></textarea>
            <div class="comment-actions">
              <span class="hint-text">Ctrl+Enter to post</span>
              <button
                type="button"
                class="btn-post"
                [disabled]="!newCommentText.trim()"
                (click)="postComment()"
              >
                Post Comment
              </button>
            </div>
          </div>

          <!-- Comments List -->
          <div class="comments-list">
            @if (comments().length === 0) {
              <div class="empty-comments">
                No comments yet. Start a discussion about this endpoint with your team.
              </div>
            }

            @for (c of comments(); track c._id) {
              <div class="comment-card">
                <div class="comment-meta">
                  <div class="avatar">{{ c.author.slice(0, 2).toUpperCase() }}</div>
                  <span class="author-name">{{ c.author }}</span>
                  <span class="comment-time">{{ formatTime(c.createdAt) }}</span>
                  <button
                    type="button"
                    class="btn-del-comment"
                    (click)="deleteComment(c._id)"
                    title="Delete comment"
                  >
                    &times;
                  </button>
                </div>
                <div class="comment-body">
                  {{ c.content }}
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1050;
      display: flex;
      justify-content: flex-end;
      backdrop-filter: blur(1px);
    }
    .drawer-panel {
      width: 380px;
      height: 100%;
      background: #121215;
      border-left: 1px solid #27272a;
      display: flex;
      flex-direction: column;
    }
    .drawer-header {
      padding: 16px;
      border-bottom: 1px solid #27272a;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .drawer-title {
      font-size: 14px;
      font-weight: 600;
      color: #fafafa;
      margin: 0;
    }
    .drawer-subtitle {
      font-size: 12px;
      color: #71717a;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 280px;
    }
    .btn-close {
      background: none;
      border: none;
      color: #71717a;
      font-size: 20px;
      cursor: pointer;
      line-height: 1;
    }
    .btn-close:hover {
      color: #fafafa;
    }

    .new-comment-box {
      padding: 14px 16px;
      border-bottom: 1px solid #27272a;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: #18181b;
    }
    .author-input {
      background: #121215;
      border: 1px solid #27272a;
      color: #fafafa;
      font-size: 12px;
      padding: 5px 8px;
      border-radius: 3px;
    }
    .comment-textarea {
      background: #121215;
      border: 1px solid #27272a;
      color: #fafafa;
      font-size: 12px;
      padding: 8px;
      border-radius: 3px;
      resize: vertical;
      font-family: inherit;
    }
    .author-input:focus, .comment-textarea:focus {
      border-color: #52525b;
      outline: none;
    }
    .comment-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .hint-text {
      font-size: 11px;
      color: #52525b;
    }
    .btn-post {
      background: #fafafa;
      color: #09090b;
      border: none;
      font-size: 11px;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 3px;
      cursor: pointer;
    }
    .btn-post:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .comments-list {
      flex: 1;
      overflow-y: auto;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .empty-comments {
      text-align: center;
      color: #71717a;
      font-size: 12px;
      padding: 24px 0;
      line-height: 1.4;
    }
    .comment-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 4px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .comment-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .avatar {
      width: 22px;
      height: 22px;
      background: #27272a;
      color: #a1a1aa;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .author-name {
      font-size: 12px;
      font-weight: 500;
      color: #fafafa;
    }
    .comment-time {
      font-size: 10px;
      color: #71717a;
      margin-left: auto;
    }
    .btn-del-comment {
      background: none;
      border: none;
      color: #52525b;
      font-size: 14px;
      cursor: pointer;
    }
    .btn-del-comment:hover {
      color: #ef4444;
    }
    .comment-body {
      font-size: 12px;
      color: #d4d4d8;
      line-height: 1.45;
      word-break: break-word;
    }
  `]
})
export class CommentsDrawerComponent {
  private api = inject(ApiService);
  private store = inject(WorkspaceStore);
  private toast = inject(ToastService);

  readonly isOpen = input<boolean>(false);
  readonly request = input<ApiRequestConfig | null>(null);
  readonly close = output<void>();

  readonly comments = signal<Comment[]>([]);
  authorName = 'Developer';
  newCommentText = '';

  constructor() {
    this.loadComments();
  }

  loadComments(): void {
    const req = this.request();
    if (!req?._id) return;

    this.api.getComments(req._id).subscribe((res) => {
      if (res.success) {
        this.comments.set(res.data);
      }
    });
  }

  postComment(): void {
    const req = this.request();
    if (!req?._id || !this.newCommentText.trim()) return;

    const wsId = this.store.activeWorkspaceId();
    if (!wsId) return;

    this.api.createComment({
      requestId: req._id,
      workspaceId: wsId,
      author: this.authorName.trim() || 'Anonymous',
      content: this.newCommentText.trim()
    }).subscribe((res) => {
      if (res.success) {
        this.newCommentText = '';
        this.loadComments();
        this.toast.show('Comment added', 'success');
      }
    });
  }

  deleteComment(id: string): void {
    this.api.deleteComment(id).subscribe((res) => {
      if (res.success) {
        this.loadComments();
        this.toast.show('Comment deleted', 'info');
      }
    });
  }

  formatTime(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
}
