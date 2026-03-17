import * as vscode from 'vscode';
import type { AIChatMessage, AIConfig } from '@types';

const CHAT_PANEL_VIEW_TYPE = 'aiChat';
const CHAT_PANEL_TITLE = 'AI Assistant';
const CONFIGURE_AI_COMMAND = 'kodus-extension.configureAI';
const AI_RESPONSE_DELAY_MS = 1000;

const WEBVIEW_COMMANDS = {
  SEND_MESSAGE: 'sendMessage',
  CONFIGURE_AI: 'configureAI',
  AI_RESPONSE: 'aiResponse',
  AI_ERROR: 'aiError',
} as const;

type WebviewOutboundMessage =
  | {
      command: typeof WEBVIEW_COMMANDS.AI_RESPONSE;
      content: string;
    }
  | {
      command: typeof WEBVIEW_COMMANDS.AI_ERROR;
      error: string;
    };

export class AIChatService {
  constructor(private readonly config: AIConfig) {}

  createChatPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
    const panel = vscode.window.createWebviewPanel(
      CHAT_PANEL_VIEW_TYPE,
      CHAT_PANEL_TITLE,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    panel.webview.html = this.generateChatHtml(panel.webview);

    panel.webview.onDidReceiveMessage(
      async (message: AIChatMessage) => {
        await this.handleWebviewMessage(message, panel);
      },
      undefined,
      context.subscriptions
    );

    return panel;
  }

  private async handleWebviewMessage(
    message: AIChatMessage,
    panel: vscode.WebviewPanel
  ): Promise<void> {
    if (message.command === WEBVIEW_COMMANDS.SEND_MESSAGE) {
      await this.processMessage(message.content, panel);
      return;
    }

    if (message.command === WEBVIEW_COMMANDS.CONFIGURE_AI) {
      await vscode.commands.executeCommand(CONFIGURE_AI_COMMAND);
    }
  }

  private async processMessage(
    content: string,
    panel: vscode.WebviewPanel
  ): Promise<void> {
    try {
      const response = await this.simulateAIResponse(content);
      await this.postMessage(panel, {
        command: WEBVIEW_COMMANDS.AI_RESPONSE,
        content: response,
      });
    } catch (error) {
      console.error('Error processing message:', error);
      await this.postMessage(panel, {
        command: WEBVIEW_COMMANDS.AI_ERROR,
        error: 'Failed to process message',
      });
    }
  }

  private async postMessage(
    panel: vscode.WebviewPanel,
    message: WebviewOutboundMessage
  ): Promise<void> {
    await panel.webview.postMessage(message);
  }

  private async simulateAIResponse(message: string): Promise<string> {
    await this.delay(AI_RESPONSE_DELAY_MS);
    return `AI Response to: "${message}"\n\nThis is a simulated response. In a real implementation, this would be sent to your AI service and streamed back in real-time.`;
  }

  private async delay(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateChatHtml(webview: vscode.Webview): string {
    const nonce = this.generateNonce();
    const model = this.escapeHtml(this.config.model);
    const serverUrl = this.escapeHtml(this.config.serverUrl);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>${CHAT_PANEL_TITLE}</title>
    <style>
${this.generateStyles()}
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <h3 class="chat-title">AI Assistant</h3>
            <div class="config-info">
                Model: ${model} | Server: ${serverUrl}
                <button class="config-button" id="configureButton">Configure</button>
            </div>
        </div>

        <div class="chat-messages" id="messages">
            <div class="message system">
                AI Assistant ready! Ask me anything about your code.
            </div>
        </div>

        <div class="chat-input">
            <div class="input-container">
                <textarea
                    class="message-input"
                    id="messageInput"
                    placeholder="Type your message here..."
                    rows="1"
                ></textarea>
                <button class="send-button" id="sendButton">Send</button>
            </div>
        </div>
    </div>

    <script nonce="${nonce}">
${this.generateScript()}
    </script>
</body>
</html>`;
  }

  private generateStyles(): string {
    return `        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
            height: 100vh;
            overflow: hidden;
        }

        .chat-container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .chat-header {
            padding: 1rem;
            border-bottom: 1px solid var(--vscode-panel-border);
            background: var(--vscode-editor-background);
            margin-bottom: 1rem;
        }

        .chat-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--vscode-foreground);
            margin: 0 0 0.5rem 0;
        }

        .config-info {
            font-size: 0.875rem;
            color: var(--vscode-descriptionForeground);
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
            text-align: center;
            max-width: 60%;
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

        .config-button {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 6px;
            padding: 0.5rem 1rem;
            cursor: pointer;
            font-size: 0.875rem;
            margin-left: 0.5rem;
        }

        .config-button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .error-message {
            background: var(--vscode-inputValidation-errorBackground);
            color: var(--vscode-inputValidation-errorForeground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 0.75rem;
            border-radius: 6px;
            margin: 0.5rem 0;
        }`;
  }

  private generateScript(): string {
    return `        const vscode = acquireVsCodeApi();
        const input = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const configureButton = document.getElementById('configureButton');

        function sendMessage() {
            const message = input.value.trim();

            if (!message) {
                return;
            }

            addMessage(message, 'user');
            input.value = '';
            sendButton.disabled = true;

            vscode.postMessage({
                command: 'sendMessage',
                content: message
            });
        }

        function configureAI() {
            vscode.postMessage({
                command: 'configureAI'
            });
        }

        function addMessage(content, type) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${type}\`;
            messageDiv.textContent = content;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        input.addEventListener('keydown', event => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });

        sendButton.addEventListener('click', sendMessage);
        configureButton.addEventListener('click', configureAI);

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'aiResponse') {
                addMessage(message.content, 'ai');
                sendButton.disabled = false;
                return;
            }

            if (message.command === 'aiError') {
                addMessage(message.error, 'system');
                sendButton.disabled = false;
            }
        });
`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private generateNonce(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';

    for (let i = 0; i < 32; i += 1) {
      nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return nonce;
  }
}
