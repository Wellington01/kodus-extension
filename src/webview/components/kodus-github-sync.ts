import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface PullRequest {
  title: string;
  number: number;
  state: 'open' | 'closed' | 'merged';
  user: {
    login: string;
  };
  updated_at: string;
  html_url?: string;
}

interface GitHubPRResponse {
  prs?: PullRequest[];
}

@customElement('kodus-github-sync')
export class KodusGithubSync extends LitElement {
  @property({ type: String }) repo = '';
  @property({ type: String }) branch = 'main';
  @state() private prs: PullRequest[] = [];
  @state() private loading = false;
  @state() private resyncing = false;
  @state() private error: string | null = null;
  @state() private lastSync: Date | null = null;

  static styles = css`
    :host {
      display: block;
    }

    .sync-container {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .sync-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .sync-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--vscode-foreground);
      margin: 0;
    }

    .last-sync {
      font-size: 0.75rem;
      color: var(--vscode-descriptionForeground);
    }

    .sync-actions {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .btn:hover:not(:disabled) {
      background: var(--vscode-button-hoverBackground);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn.primary {
      background: var(--vscode-button-background);
    }

    .btn.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .btn.success {
      background: var(--vscode-gitDecoration-addedResourceForeground);
      color: var(--vscode-editor-background);
    }

    .btn.resync {
      background: var(--vscode-gitDecoration-modifiedResourceForeground);
      color: var(--vscode-editor-background);
    }

    .pr-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .pr-item {
      background: var(--vscode-list-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .pr-item:hover {
      background: var(--vscode-list-hoverBackground);
      border-color: var(--vscode-focusBorder);
    }

    .pr-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .pr-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--vscode-foreground);
      margin: 0;
    }

    .pr-number {
      font-size: 0.75rem;
      color: var(--vscode-descriptionForeground);
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
    }

    .pr-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: var(--vscode-descriptionForeground);
    }

    .pr-status {
      display: inline-block;
      padding: 0.125rem 0.375rem;
      border-radius: 3px;
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .pr-status.open {
      background: var(--vscode-gitDecoration-addedResourceForeground);
      color: var(--vscode-editor-background);
    }

    .pr-status.closed {
      background: var(--vscode-gitDecoration-deletedResourceForeground);
      color: var(--vscode-editor-background);
    }

    .pr-status.merged {
      background: var(--vscode-gitDecoration-modifiedResourceForeground);
      color: var(--vscode-editor-background);
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--vscode-descriptionForeground);
      font-size: 0.875rem;
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid var(--vscode-progressBar-background);
      border-top: 2px solid var(--vscode-progressBar-foreground);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .error {
      color: var(--vscode-inputValidation-errorForeground);
      background: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      padding: 0.75rem;
      border-radius: 4px;
      margin-top: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--vscode-descriptionForeground);
    }
  `;

  render() {
    return html`
      <div class="sync-container">
        <div class="sync-header">
          <h3 class="sync-title">GitHub PR Sync</h3>
          ${this.lastSync
            ? html`
                <span class="last-sync">
                  Last sync: ${this.lastSync.toLocaleTimeString()}
                </span>
              `
            : ''}
        </div>

        <div class="sync-actions">
          <button
            class="btn primary"
            ?disabled=${this.loading}
            @click=${this._fetchPRs}
          >
            ${this.loading ? 'Syncing...' : 'Sync PRs'}
          </button>

          <button
            class="btn secondary"
            ?disabled=${this.loading}
            @click=${this._createPR}
          >
            Create PR
          </button>

          <button
            class="btn success"
            ?disabled=${this.loading}
            @click=${this._mergePRs}
          >
            Auto Merge
          </button>
        </div>

        ${this.loading
          ? html`
              <div class="loading">
                <div class="spinner"></div>
                Syncing with GitHub...
              </div>
            `
          : ''}
        ${this.error
          ? html`
              <div class="error"><strong>Error:</strong> ${this.error}</div>
            `
          : ''}
        ${this.prs.length > 0
          ? html`
              <div class="pr-list">
                ${this.prs.map(
                  pr => html`
                    <div class="pr-item" @click=${() => this._openPR(pr)}>
                      <div class="pr-header">
                        <h4 class="pr-title">${pr.title}</h4>
                        <span class="pr-number">#${pr.number}</span>
                      </div>
                      <div class="pr-meta">
                        <span class="pr-status ${pr.state}">${pr.state}</span>
                        <span>by ${pr.user.login}</span>
                        <span>${this._formatDate(pr.updated_at)}</span>
                      </div>
                    </div>
                  `
                )}
              </div>
            `
          : html`
              <div class="empty-state">
                <p>
                  No pull requests found. Click "Sync PRs" to fetch from GitHub.
                </p>
              </div>
            `}
      </div>
    `;
  }

  private async _fetchPRs() {
    this.loading = true;
    this.error = null;

    try {
      const result = await this._sendMessageToExtension('fetch-github-prs', {
        repo: this.repo,
        branch: this.branch,
      });

      this.prs = result.prs || [];
      this.lastSync = new Date();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch PRs';
    } finally {
      this.loading = false;
    }
  }

  private async _resyncPRs() {
    this.resyncing = true;
    this.error = null;

    // Clear existing data before resyncing
    this.prs = [];
    this.lastSync = null;

    try {
      const result = (await this._sendMessageToExtension('resync-github-prs', {
        repo: this.repo,
        branch: this.branch,
        force: true,
      })) as GitHubPRResponse;

      this.prs = result.prs || [];
      this.lastSync = new Date();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to resync PRs';
    } finally {
      this.resyncing = false;
    }
  }

  private async _createPR() {
    try {
      await this._sendMessageToExtension('create-github-pr', {
        repo: this.repo,
        branch: this.branch,
      });

      // Refresh PRs after creating
      await this._fetchPRs();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to create PR';
    }
  }

  private async _mergePRs() {
    try {
      await this._sendMessageToExtension('auto-merge-prs', {
        repo: this.repo,
        branch: this.branch,
      });

      // Refresh PRs after merging
      await this._fetchPRs();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to merge PRs';
    }
  }

  private _openPR(pr: PullRequest) {
    this._sendMessageToExtension('open-github-pr', {
      repo: this.repo,
      prNumber: pr.number,
    });
  }

  private _formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'today';
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  private _sendMessageToExtension(
    command: string,
    data: Record<string, unknown>
  ) {
    return new Promise((resolve, reject) => {
      const message = { command, data };

      // Send message to webview provider
      window.parent.postMessage(message, '*');

      // Listen for response
      const handleResponse = (event: MessageEvent) => {
        if (event.data.command === `${command}-response`) {
          window.removeEventListener('message', handleResponse);
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };

      window.addEventListener('message', handleResponse);

      // Timeout after 30 seconds
      setTimeout(() => {
        window.removeEventListener('message', handleResponse);
        reject(new Error('Request timeout'));
      }, 30000);

      const handleResponse = (event: MessageEvent) => {
        if (event.data?.command !== `${command}-response`) {
          return;
        }
        if (event.data?.requestId && event.data.requestId !== requestId) {
          return;
        }
        if (!event.data?.requestId && requestId) {
          return;
        }

        if (settled) {
          return;
        }
        settled = true;
        window.clearTimeout(timeoutId);
        window.removeEventListener('message', handleResponse);
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.result);
        }
      };

      window.addEventListener('message', handleResponse);
    });
  }

  private _getVsCodeApi():
    | { postMessage: (message: unknown) => void }
    | undefined {
    try {
      return (
        window as typeof window & {
          acquireVsCodeApi?: () => { postMessage: (message: unknown) => void };
        }
      ).acquireVsCodeApi?.();
    } catch {
      return undefined;
    }
  }

  private _createRequestId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
