import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

@customElement('kodus-ai-chat')
export class KodusAiChat extends LitElement {
  @property({ type: String }) serverUrl = '';
  @property({ type: String }) apiKey = '';
  @property({ type: String }) model = 'gpt-4';
  @property({ type: Number }) temperature = 0.7;
  @property({ type: Number }) maxTokens = 2048;

  @state() private messages: ChatMessage[] = [];
  @state() private connected = false;
  @state() private isLoading = false;
  @state() private connectionError = '';
  @state() private currentStreamMessage = '';

  private eventSource?: EventSource;
  private messageId = 0;

  static styles = css`
    :host {
      display: block;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      height: 100%;
      overflow: hidden;
    }

    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 600px;
    }

    .chat-header {
      padding: 1rem;
      border-bottom: 1px solid var(--vscode-panel-border);
      background: var(--vscode-editor-background);
    }

    .chat-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--vscode-foreground);
      margin: 0 0 0.5rem 0;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--vscode-charts-red);
    }

    .status-indicator.connected {
      background: var(--vscode-charts-green);
    }

    .status-indicator.connecting {
      background: var(--vscode-charts-orange);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .message {
      max-width: 80%;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      word-wrap: break-word;
      position: relative;
    }

    .message.user {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      align-self: flex-end;
      margin-left: auto;
    }

    .message.ai {
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-panel-border);
      align-self: flex-start;
    }

    .message.system {
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      align-self: center;
      font-size: 0.875rem;
      text-align: center;
      max-width: 60%;
    }

    .message-content {
      margin: 0;
      line-height: 1.4;
      white-space: pre-wrap;
    }

    .message-time {
      font-size: 0.75rem;
      opacity: 0.7;
      margin-top: 0.25rem;
    }

    .streaming-indicator {
      display: inline-block;
      width: 3px;
      height: 1em;
      background: var(--vscode-foreground);
      animation: blink 1s infinite;
      margin-left: 2px;
    }

    @keyframes blink {
      0%,
      50% {
        opacity: 1;
      }
      51%,
      100% {
        opacity: 0;
      }
    }

    .chat-input {
      padding: 1rem;
      border-top: 1px solid var(--vscode-panel-border);
      background: var(--vscode-editor-background);
    }

    .input-container {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
    }

    .message-input {
      flex: 1;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border);
      border-radius: 6px;
      padding: 0.75rem;
      font-family: inherit;
      font-size: inherit;
      resize: none;
      min-height: 44px;
      max-height: 120px;
    }

    .message-input:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
    }

    .send-button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 6px;
      padding: 0.75rem 1rem;
      cursor: pointer;
      font-size: 0.875rem;
      min-width: 60px;
      height: 44px;
    }

    .send-button:hover:not(:disabled) {
      background: var(--vscode-button-hoverBackground);
    }

    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-message {
      background: var(--vscode-inputValidation-errorBackground);
      color: var(--vscode-inputValidation-errorForeground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      padding: 0.75rem;
      border-radius: 6px;
      margin: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--vscode-descriptionForeground);
      font-size: 0.875rem;
      padding: 0.75rem 1rem;
    }

    .spinner {
      width: 16px;
      height: 16px;
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
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.connect();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.disconnect();
  }

  private connect() {
    if (!this.serverUrl) {
      this.connectionError = 'Server URL not configured';
      return;
    }

    try {
      this.isConnected = false;
      this.connectionError = '';

      const url = new URL('/api/ai/stream', this.serverUrl);
      if (this.apiKey) {
        url.searchParams.set('apiKey', this.apiKey);
      }
      if (this.model) {
        url.searchParams.set('model', this.model);
      }
      if (this.temperature) {
        url.searchParams.set('temperature', this.temperature.toString());
      }
      if (this.maxTokens) {
        url.searchParams.set('maxTokens', this.maxTokens.toString());
      }

      this.eventSource = new EventSource(url.toString());

      this.eventSource.onopen = () => {
        this.connected = true;
        this.connectionError = '';
        this.addSystemMessage('Connected to AI service');
      };

      this.eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          this.handleStreamMessage(data);
        } catch (error) {
          console.error('Error parsing stream message:', error);
        }
      };

      this.eventSource.onerror = error => {
        console.error('Stream error:', error);
        this.connected = false;
        this.connectionError = 'Connection error with AI service';
        this.addSystemMessage('Connection lost with AI service');
      };
    } catch (error) {
      this.connectionError = `Failed to connect: ${error}`;
    }
  }

  private disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    this.connected = false;
  }

  private handleStreamMessage(data: any) {
    switch (data.type) {
      case 'text':
        this.handleTextChunk(data.content);
        break;
      case 'done':
        this.finalizeCurrentMessage();
        break;
      case 'error':
        this.addSystemMessage(`Error: ${data.content}`, 'system');
        break;
      case 'metadata':
        this.addSystemMessage(data.content, 'system');
        break;
    }
  }

  private handleTextChunk(chunk: string) {
    if (!this.currentStreamMessage) {
      // Inicia nova mensagem AI
      this.currentStreamMessage = '';
      this.addMessage('', 'ai', true);
    }

    this.currentStreamMessage += chunk;
    this.updateLastMessage(this.currentStreamMessage, true);
  }

  private finalizeCurrentMessage() {
    if (this.currentStreamMessage) {
      this.updateLastMessage(this.currentStreamMessage, false);
      this.currentStreamMessage = '';
    }
  }

  private addMessage(
    content: string,
    type: 'user' | 'ai' | 'system',
    isStreaming = false
  ) {
    const message: ChatMessage = {
      id: `msg-${++this.messageId}`,
      type,
      content,
      timestamp: Date.now(),
      isStreaming,
    };

    this.messages = [...this.messages, message];
  }

  private updateLastMessage(content: string, isStreaming = false) {
    if (this.messages.length === 0) return;

    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage.type === 'ai') {
      this.messages = this.messages.map((msg, index) =>
        index === this.messages.length - 1
          ? { ...msg, content, isStreaming }
          : msg
      );
    }
  }

  private addSystemMessage(content: string, type: 'system' = 'system') {
    this.addMessage(content, type);
  }

  private async sendMessage() {
    const input = this.shadowRoot?.querySelector(
      '.message-input'
    ) as HTMLTextAreaElement;
    const message = input.value.trim();

    if (!message || this.isLoading || !this.connected) return;

    // Adiciona mensagem do usuário
    this.addMessage(message, 'user');
    input.value = '';
    this.isLoading = true;

    try {
      const response = await fetch(`${this.serverUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify({
          message,
          context: {
            conversationHistory: this.messages.slice(-10), // Últimas 10 mensagens como contexto
          },
          config: {
            model: this.model,
            temperature: this.temperature,
            maxTokens: this.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      this.addSystemMessage(`Failed to send message: ${error}`, 'system');
    } finally {
      this.isLoading = false;
    }
  }

  private handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  override render() {
    return html`
      <div class="chat-container">
        <div class="chat-header">
          <h3 class="chat-title">🤖 AI Assistant</h3>
          <div class="connection-status">
            <div
              class="status-indicator ${this.connected
                ? 'connected'
                : 'connecting'}"
            ></div>
            <span>${this.connected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>

        ${this.connectionError
          ? html` <div class="error-message">${this.connectionError}</div> `
          : ''}

        <div class="chat-messages">
          ${this.messages.map(
            msg => html`
              <div class="message ${msg.type}">
                <p class="message-content">
                  ${msg.content}
                  ${msg.isStreaming
                    ? html`<span class="streaming-indicator"></span>`
                    : ''}
                </p>
                <div class="message-time">
                  ${this.formatTime(msg.timestamp)}
                </div>
              </div>
            `
          )}
          ${this.isLoading
            ? html`
                <div class="loading">
                  <div class="spinner"></div>
                  <span>AI is thinking...</span>
                </div>
              `
            : ''}
        </div>

        <div class="chat-input">
          <div class="input-container">
            <textarea
              class="message-input"
              placeholder="Type your message here..."
              rows="1"
              @keydown="${this.handleKeyPress}"
              ?disabled="${!this.connected || this.isLoading}"
            ></textarea>
            <button
              class="send-button"
              @click="${this.sendMessage}"
              ?disabled="${!this.connected || this.isLoading}"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
