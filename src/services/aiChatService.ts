import * as vscode from 'vscode';
import type { AIConfig, AIMessage } from '@types';

type ChatWebviewMessage =
  | { command: 'sendMessage'; content: string }
  | { command: 'configureAI' };

export class AIChatService {
  constructor(private config: AIConfig) {}

  /**
   * Criar webview panel para chat AI
   */
  createChatPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
    const panel = vscode.window.createWebviewPanel(
      'aiChat',
      'AI Chat',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    panel.webview.html = this.generateChatHtml(panel.webview);

    // Handle messages from webview
    panel.webview.onDidReceiveMessage(
      async (message: ChatWebviewMessage) => {
        await this.handleWebviewMessage(message, panel, context);
      },
      undefined,
      context.subscriptions
    );

    return panel;
  }

  /**
   * Processar mensagem do webview
   */
  private async handleWebviewMessage(
    message: ChatWebviewMessage,
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext
  ): Promise<void> {
    switch (message.command) {
      case 'sendMessage':
        await this.processMessage(message.content, panel);
        break;
      case 'configureAI':
        await vscode.commands.executeCommand('kodus-extension.configureAI');
        break;
    }
  }

  /**
   * Processar mensagem do usuário
   */
  private async processMessage(
    content: string,
    panel: vscode.WebviewPanel
  ): Promise<void> {
    try {
      // Aqui você implementaria a lógica real de envio para o AI
      console.log('AI message:', content);

      // Simular resposta
      const response = await this.simulateAIResponse(content);

      panel.webview.postMessage({
        command: 'aiResponse',
        content: response,
      });
    } catch (error) {
      console.error('Error processing message:', error);
      panel.webview.postMessage({
        command: 'aiError',
        error: 'Failed to process message',
      });
    }
  }

  // VIOLATION: Method with a silent catch block for testing the review process.
  private async processMessageWithViolation(content: string): Promise<void> {
    try {
      // This would normally throw an error.
      JSON.parse("{ 'invalidJSON' }");
    } catch (error) {
      // Silently ignoring the error, which is bad practice.
    }
  }

  /**
   * Simular resposta do AI (para desenvolvimento)
   */
  private async simulateAIResponse(message: string): Promise<string> {
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 1000));

    return `AI Response to: "${message}"\n\nThis is a simulated response. In a real implementation, this would be sent to your AI service and streamed back in real-time.`;
  }

  /**
   * Gerar HTML para o chat
   */
  private generateChatHtml(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chat</title>
    <style>
        body {
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
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <h3 class="chat-title">🤖 AI Assistant</h3>
            <div class="config-info">
                Model: ${this.config.model} | Server: ${this.config.serverUrl}
                <button class="config-button" onclick="configureAI()">Configure</button>
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
                <button class="send-button" onclick="sendMessage()">Send</button>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message to chat
            addMessage(message, 'user');
            input.value = '';
            
            // Send to extension
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
        
        // Handle Enter key
        document.getElementById('messageInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'aiResponse') {
                addMessage(message.content, 'ai');
            }
        });
    </script>
</body>
</html>`;
  }
}
