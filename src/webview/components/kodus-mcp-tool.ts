import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('kodus-mcp-tool')
export class KodusMcpTool extends LitElement {
  @property({ type: String }) toolName = '';
  @property({ type: String }) description = '';
  @property({ type: Boolean }) loading = false;
  @state() private result: any = null;
  @state() private error: string | null = null;

  static styles = css`
    :host {
      display: block;
    }

    .tool-container {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .tool-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .tool-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--vscode-foreground);
      margin: 0;
    }

    .tool-description {
      font-size: 0.875rem;
      color: var(--vscode-descriptionForeground);
      margin: 0 0 1rem 0;
      line-height: 1.4;
    }

    .tool-actions {
      display: flex;
      gap: 0.5rem;
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

    .result-container {
      margin-top: 1rem;
      padding: 0.75rem;
      background: var(--vscode-textCodeBlock-background);
      border-radius: 4px;
      border: 1px solid var(--vscode-panel-border);
    }

    .result-header {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--vscode-foreground);
      margin-bottom: 0.5rem;
    }

    .result-content {
      font-family: var(--vscode-editor-font-family);
      font-size: 0.875rem;
      color: var(--vscode-foreground);
      white-space: pre-wrap;
      word-break: break-word;
    }

    .error {
      color: var(--vscode-inputValidation-errorForeground);
      background: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      padding: 0.75rem;
      border-radius: 4px;
      margin-top: 1rem;
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
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  render() {
    return html`
      <div class="tool-container">
        <div class="tool-header">
          <h3 class="tool-name">${this.toolName}</h3>
        </div>
        
        <p class="tool-description">${this.description}</p>
        
        <div class="tool-actions">
          <button 
            class="btn primary" 
            ?disabled=${this.loading}
            @click=${this._executeTool}
          >
            ${this.loading ? 'Executing...' : 'Execute'}
          </button>
          
          <button 
            class="btn secondary" 
            ?disabled=${this.loading}
            @click=${this._clearResult}
          >
            Clear
          </button>
        </div>

        ${this.loading ? html`
          <div class="loading">
            <div class="spinner"></div>
            Executing MCP tool...
          </div>
        ` : ''}

        ${this.result ? html`
          <div class="result-container">
            <div class="result-header">Result:</div>
            <div class="result-content">${JSON.stringify(this.result, null, 2)}</div>
          </div>
        ` : ''}

        ${this.error ? html`
          <div class="error">
            <strong>Error:</strong> ${this.error}
          </div>
        ` : ''}
      </div>
    `;
  }

  private async _executeTool() {
    this.loading = true;
    this.error = null;
    this.result = null;

    try {
      // Send message to extension to execute MCP tool
      const result = await this._sendMessageToExtension('execute-mcp-tool', {
        toolName: this.toolName
      });
      
      this.result = result;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error occurred';
    } finally {
      this.loading = false;
    }
  }

  private _clearResult() {
    this.result = null;
    this.error = null;
  }

  private _sendMessageToExtension(command: string, data: any) {
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
    });
  }
}
