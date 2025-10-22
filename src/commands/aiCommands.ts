import * as vscode from 'vscode';
import type { ExtensionContext } from '@types';

export function registerAICommands(context: ExtensionContext) {
  // Comando para configurar AI
  const configureAICommand = vscode.commands.registerCommand(
    'kodus-extension.configureAI',
    async () => {
      const serverUrl = await vscode.window.showInputBox({
        prompt: 'Enter AI server URL',
        placeHolder: 'https://your-ai-server.com',
        value: context.globalState.get('ai.serverUrl', ''),
        validateInput: value => {
          if (!value) {
            return 'Server URL is required';
          }
          try {
            new URL(value);
            return null;
          } catch {
            return 'Please enter a valid URL';
          }
        },
      });

      if (!serverUrl) return;

      const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter API Key (optional)',
        placeHolder: 'Leave empty if no authentication required',
        password: true,
        value: context.globalState.get('ai.apiKey', ''),
      });

      const model = await vscode.window.showQuickPick(
        [
          { label: 'gpt-4', description: 'Most capable model' },
          { label: 'gpt-3.5-turbo', description: 'Faster and cheaper' },
          { label: 'claude-3-opus', description: 'Anthropic Claude' },
          { label: 'custom', description: 'Enter custom model name' },
        ],
        {
          placeHolder: 'Select AI model',
        }
      );

      let selectedModel = model?.label || 'gpt-4';
      if (selectedModel === 'custom') {
        const customModel = await vscode.window.showInputBox({
          prompt: 'Enter custom model name',
          placeHolder: 'e.g., my-custom-model',
        });
        if (customModel) {
          selectedModel = customModel;
        }
      }

      const temperature = await vscode.window.showInputBox({
        prompt: 'Enter temperature (0.0 - 1.0)',
        placeHolder: '0.7',
        value: context.globalState.get('ai.temperature', '0.7'),
        validateInput: value => {
          const num = parseFloat(value);
          if (isNaN(num) || num < 0 || num > 1) {
            return 'Temperature must be between 0.0 and 1.0';
          }
          return null;
        },
      });

      const maxTokens = await vscode.window.showInputBox({
        prompt: 'Enter max tokens',
        placeHolder: '2048',
        value: context.globalState.get('ai.maxTokens', '2048'),
        validateInput: value => {
          const num = parseInt(value);
          if (isNaN(num) || num < 1) {
            return 'Max tokens must be a positive number';
          }
          return null;
        },
      });

      // Salvar configurações
      await context.globalState.update('ai.serverUrl', serverUrl);
      await context.globalState.update('ai.apiKey', apiKey || '');
      await context.globalState.update('ai.model', selectedModel);
      await context.globalState.update('ai.temperature', temperature || '0.7');
      await context.globalState.update('ai.maxTokens', maxTokens || '2048');

      vscode.window.showInformationMessage(
        'AI configuration saved successfully!'
      );
    }
  );

  // Comando para iniciar chat AI
  const startAIChatCommand = vscode.commands.registerCommand(
    'kodus-extension.startAIChat',
    async () => {
      const config = {
        serverUrl: context.globalState.get('ai.serverUrl', ''),
        apiKey: context.globalState.get('ai.apiKey', ''),
        model: context.globalState.get('ai.model', 'gpt-4'),
        temperature: parseFloat(
          context.globalState.get('ai.temperature', '0.7')
        ),
        maxTokens: parseInt(context.globalState.get('ai.maxTokens', '2048')),
      };

      if (!config.serverUrl) {
        const result = await vscode.window.showWarningMessage(
          'AI server not configured. Would you like to configure it now?',
          'Configure',
          'Cancel'
        );

        if (result === 'Configure') {
          await vscode.commands.executeCommand('kodus-extension.configureAI');
        }
        return;
      }

      // Abrir webview com chat AI
      const panel = vscode.window.createWebviewPanel(
        'aiChat',
        'AI Chat',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      panel.webview.html = getAIChatHtml(panel.webview, config);

      // Handle messages from webview
      panel.webview.onDidReceiveMessage(
        async message => {
          switch (message.command) {
            case 'sendMessage':
              // Aqui você pode processar a mensagem e enviar para o AI
              console.log('AI message:', message.content);
              break;
            case 'configureAI':
              await vscode.commands.executeCommand(
                'kodus-extension.configureAI'
              );
              break;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  // Comando para analisar código com AI
  const analyzeCodeCommand = vscode.commands.registerCommand(
    'kodus-extension.analyzeCode',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
      }

      const selectedText = editor.selection.isEmpty
        ? editor.document.getText()
        : editor.document.getText(editor.selection);

      const analysisType = await vscode.window.showQuickPick(
        [
          {
            label: 'Code Review',
            description: 'Review code quality and suggest improvements',
          },
          {
            label: 'Bug Detection',
            description: 'Look for potential bugs and issues',
          },
          {
            label: 'Performance Analysis',
            description: 'Analyze performance and optimization opportunities',
          },
          {
            label: 'Security Review',
            description: 'Check for security vulnerabilities',
          },
          {
            label: 'Documentation',
            description: 'Generate documentation for the code',
          },
          {
            label: 'Custom Analysis',
            description: 'Specify custom analysis requirements',
          },
        ],
        {
          placeHolder: 'Select analysis type',
        }
      );

      if (!analysisType) return;

      let customPrompt: string | undefined;
      if (analysisType.label === 'Custom Analysis') {
        customPrompt = await vscode.window.showInputBox({
          prompt: 'Enter custom analysis prompt',
          placeHolder: 'e.g., Explain this code and suggest improvements',
        });
        if (!customPrompt) return;
      }

      // Mostrar progresso
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Analyzing code with AI...',
          cancellable: true,
        },
        async (progress, token) => {
          try {
            // Aqui você implementaria a chamada para o AI
            // Por enquanto, vamos simular com um timeout
            await new Promise(resolve => setTimeout(resolve, 2000));

            const prompt =
              customPrompt ||
              getAnalysisPrompt(analysisType.label, selectedText);

            // Simular resultado da análise
            const result = `Analysis Result for ${analysisType.label}:\n\n${selectedText.substring(0, 100)}...`;

            // Mostrar resultado em um documento
            const doc = await vscode.workspace.openTextDocument({
              content: result,
              language: 'markdown',
            });
            await vscode.window.showTextDocument(doc);
          } catch (error) {
            vscode.window.showErrorMessage(`Analysis failed: ${error}`);
          }
        }
      );
    }
  );

  context.subscriptions.push(
    configureAICommand,
    startAIChatCommand,
    analyzeCodeCommand
  );
}

function getAnalysisPrompt(analysisType: string, code: string): string {
  const prompts = {
    'Code Review': `Please review the following code and provide feedback on:\n- Code quality and best practices\n- Potential improvements\n- Readability and maintainability\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    'Bug Detection': `Please analyze the following code for potential bugs and issues:\n- Logic errors\n- Edge cases not handled\n- Type safety issues\n- Runtime errors\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    'Performance Analysis': `Please analyze the performance of the following code:\n- Time complexity\n- Space complexity\n- Optimization opportunities\n- Bottlenecks\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    'Security Review': `Please review the following code for security vulnerabilities:\n- Input validation\n- Authentication/authorization\n- Data exposure\n- Injection attacks\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
    Documentation: `Please generate comprehensive documentation for the following code:\n- Function/class descriptions\n- Parameter explanations\n- Usage examples\n- Return value descriptions\n\nCode:\n\`\`\`\n${code}\n\`\`\``,
  };

  return (
    prompts[analysisType as keyof typeof prompts] ||
    `Please analyze the following code:\n\n\`\`\`\n${code}\n\`\`\``
  );
}

function getAIChatHtml(webview: vscode.Webview, config: any): string {
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
                Model: ${config.model} | Server: ${config.serverUrl}
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
