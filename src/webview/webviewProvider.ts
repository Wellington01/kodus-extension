import * as vscode from 'vscode';
import type {
  ExtensionContext,
  GitExtension,
  API,
  Repository,
  MainWebviewMessage,
  GitHubPRMessage,
  InitializeAICommand,
} from '@types';
import { hasGetAPI } from '@types';
import { AIManager, AIStreamProvider } from '@providers/aiStreamProvider';
import type { CaseConverterType } from '@utils/caseConverter';

export class KodusWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kodus-extension.webview';

  private _view?: vscode.WebviewView;
  private aiManager: AIManager;
  private aiProvider?: AIStreamProvider;

  constructor(private readonly context: ExtensionContext) {
    this.aiManager = new AIManager(context);
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'media'),
      ],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      (message: MainWebviewMessage) => {
        switch (message.command) {
          case 'formatJson':
            this._formatJson();
            return;
          case 'convertCase':
            this._convertCase();
            return;
          case 'insertTimestamp':
            this._insertTimestamp();
            return;
          case 'insertSnippet':
            this._insertSnippet();
            return;
          case 'initializeAI':
            this._initializeAI(message);
            return;
          case 'sendAIMessage':
            this._sendAIMessage(message.content, message.context);
            return;
          case 'disconnectAI':
            this._disconnectAI();
            return;
          case 'fetchGitHubPRs':
            this._fetchGitHubPRs(webviewView.webview, false);
            return;
          case 'resyncGitHubPRs':
            this._fetchGitHubPRs(webviewView.webview, true);
            return;
          case 'createGitHubPR':
            this._createGitHubPR(webviewView.webview);
            return;
          case 'autoMergePRs':
            this._autoMergePRs(webviewView.webview);
            return;
          case 'openGitHubPR':
            this._openGitHubPR(message.prNumber);
            return;
          case 'fetch-github-prs':
          case 'resync-github-prs':
            this._handleGitHubPRMessage(webviewView.webview, message as GitHubPRMessage);
            return;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kodus Tools</title>
    <style>
        body { 
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: var(--vscode-foreground);
            margin: 0 0 10px 0;
            font-size: 1.5rem;
        }
        
        .header p {
            color: var(--vscode-descriptionForeground);
            margin: 0;
        }
        
        .tools-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .tool-card {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .tool-card:hover {
            background: var(--vscode-list-hoverBackground);
            border-color: var(--vscode-focusBorder);
        }
        
        .tool-icon {
            font-size: 2rem;
            margin-bottom: 10px;
        }
        
        .tool-title {
            font-size: 1rem;
            font-weight: 600;
            color: var(--vscode-foreground);
            margin: 0 0 5px 0;
        }
        
        .tool-description {
            font-size: 0.875rem;
            color: var(--vscode-descriptionForeground);
            margin: 0;
        }
        
        .status {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-size: 0.875rem;
        }
        
        .section {
            margin-bottom: 2rem;
        }
        
        .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--vscode-foreground);
            margin-bottom: 1rem;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 0.5rem;
        }
        
        .mcp-tools, .github-sync {
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        
        .mcp-tool {
            margin-bottom: 1rem;
            padding: 0.75rem;
            background: var(--vscode-list-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
        }
        
        .mcp-tool-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .mcp-tool-name {
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        
        .mcp-tool-description {
            font-size: 0.875rem;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 0.75rem;
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
            margin-right: 0.5rem;
        }
        
        .btn:hover:not(:disabled) {
            background: var(--vscode-button-hoverBackground);
        }
        
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .btn.secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
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
        
        .result {
            margin-top: 1rem;
            padding: 0.75rem;
            background: var(--vscode-textCodeBlock-background);
            border-radius: 4px;
            border: 1px solid var(--vscode-panel-border);
            font-family: var(--vscode-editor-font-family);
            font-size: 0.875rem;
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
        
        .github-pr {
            background: var(--vscode-list-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .github-pr:hover {
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
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Kodus Tools</h1>
        <p>Open source development tools and utilities</p>
    </div>
    
    <!-- Quick Actions Section -->
    <div class="section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="tools-grid">
            <div class="tool-card" onclick="executeCommand('kodus-extension.formatJson')">
                <div class="tool-icon">📄</div>
                <div class="tool-title">Format JSON</div>
                <div class="tool-description">Format and validate JSON files</div>
            </div>
            
            <div class="tool-card" onclick="executeCommand('kodus-extension.convertCase')">
                <div class="tool-icon">🔄</div>
                <div class="tool-title">Convert Case</div>
                <div class="tool-description">Convert text between different cases</div>
            </div>
            
            <div class="tool-card" onclick="executeCommand('kodus-extension.insertTimestamp')">
                <div class="tool-icon">⏰</div>
                <div class="tool-title">Insert Timestamp</div>
                <div class="tool-description">Insert current timestamp</div>
            </div>
            
            <div class="tool-card" onclick="executeCommand('kodus-extension.insertSnippet')">
                <div class="tool-icon">📝</div>
                <div class="tool-title">Insert Snippet</div>
                <div class="tool-description">Insert code snippets</div>
            </div>
        </div>
    </div>
    
    <!-- MCP Tools Section -->
    <div class="section">
        <h2 class="section-title">MCP Tools</h2>
        <div class="mcp-tools">
            <div class="mcp-tool">
                <div class="mcp-tool-header">
                    <div class="mcp-tool-name">Code Analysis</div>
                </div>
                <div class="mcp-tool-description">Analyze code quality and suggest improvements</div>
                <button class="btn" onclick="executeMcpTool('code-analysis')">Execute</button>
                <button class="btn secondary" onclick="clearMcpResult('code-analysis')">Clear</button>
                <div id="code-analysis-result" class="result" style="display: none;"></div>
                <div id="code-analysis-error" class="error" style="display: none;"></div>
            </div>
            
            <div class="mcp-tool">
                <div class="mcp-tool-header">
                    <div class="mcp-tool-name">Documentation Generator</div>
                </div>
                <div class="mcp-tool-description">Generate documentation from code comments</div>
                <button class="btn" onclick="executeMcpTool('doc-generator')">Execute</button>
                <button class="btn secondary" onclick="clearMcpResult('doc-generator')">Clear</button>
                <div id="doc-generator-result" class="result" style="display: none;"></div>
                <div id="doc-generator-error" class="error" style="display: none;"></div>
            </div>
        </div>
    </div>
    
    <!-- GitHub Sync Section -->
    <div class="section">
        <h2 class="section-title">GitHub Integration</h2>
        <div class="github-sync">
            <div class="mcp-tool-header">
                <div class="mcp-tool-name">GitHub PR Sync</div>
                <span id="last-sync" class="loading" style="display: none;">Last sync: <span id="sync-time"></span></span>
            </div>
            <div class="mcp-tool-description">Sync and manage pull requests with GitHub</div>
            <button class="btn" onclick="fetchGitHubPRs()">Sync PRs</button>
            <button class="btn" onclick="resyncGitHubPRs()" style="background: var(--vscode-gitDecoration-modifiedResourceForeground);">Resync</button>
            <button class="btn secondary" onclick="createGitHubPR()">Create PR</button>
            <button class="btn" onclick="autoMergePRs()">Auto Merge</button>
            
            <div id="github-loading" class="loading" style="display: none;">
                <div class="spinner"></div>
                Syncing with GitHub...
            </div>
            
            <div id="github-error" class="error" style="display: none;"></div>
            <div id="github-prs"></div>
        </div>
    </div>
    
    <div class="status">
        <p>Ready to help! ✨</p>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function executeCommand(command) {
            vscode.postMessage({
                command: 'executeCommand',
                commandName: command
            });
        }
        
        function executeMcpTool(toolName) {
            const resultDiv = document.getElementById(toolName + '-result');
            const errorDiv = document.getElementById(toolName + '-error');
            
            // Show loading state
            resultDiv.style.display = 'none';
            errorDiv.style.display = 'none';
            
            vscode.postMessage({
                command: 'executeMcpTool',
                toolName: toolName
            });
        }
        
        function clearMcpResult(toolName) {
            const resultDiv = document.getElementById(toolName + '-result');
            const errorDiv = document.getElementById(toolName + '-error');
            
            resultDiv.style.display = 'none';
            errorDiv.style.display = 'none';
            resultDiv.textContent = '';
            errorDiv.textContent = '';
        }
        
        function fetchGitHubPRs() {
            const loadingDiv = document.getElementById('github-loading');
            const errorDiv = document.getElementById('github-error');
            const prsDiv = document.getElementById('github-prs');
            
            loadingDiv.style.display = 'flex';
            errorDiv.style.display = 'none';
            prsDiv.innerHTML = '';
            
            vscode.postMessage({
                command: 'fetchGitHubPRs'
            });
        }
        
        function resyncGitHubPRs() {
            const loadingDiv = document.getElementById('github-loading');
            const errorDiv = document.getElementById('github-error');
            const prsDiv = document.getElementById('github-prs');
            
            loadingDiv.style.display = 'flex';
            loadingDiv.innerHTML = '<div class="spinner"></div> Resyncing with GitHub (clearing cache)...';
            errorDiv.style.display = 'none';
            prsDiv.innerHTML = '';
            
            vscode.postMessage({
                command: 'resyncGitHubPRs'
            });
        }
        
        function createGitHubPR() {
            vscode.postMessage({
                command: 'createGitHubPR'
            });
        }
        
        function autoMergePRs() {
            vscode.postMessage({
                command: 'autoMergePRs'
            });
        }
        
        function formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                return 'today';
            } else if (diffDays === 1) {
                return 'yesterday';
            } else if (diffDays < 7) {
                return diffDays + ' days ago';
            } else {
                return date.toLocaleDateString();
            }
        }
        
        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'showMessage':
                    console.log('Message from extension:', message.text);
                    break;
                    
                case 'mcpToolResult':
                    const toolName = message.toolName;
                    const resultDiv = document.getElementById(toolName + '-result');
                    const errorDiv = document.getElementById(toolName + '-error');
                    
                    if (message.error) {
                        errorDiv.textContent = message.error;
                        errorDiv.style.display = 'block';
                    } else {
                        resultDiv.textContent = JSON.stringify(message.result, null, 2);
                        resultDiv.style.display = 'block';
                    }
                    break;
                    
                case 'githubPRsResult':
                    const githubLoading = document.getElementById('github-loading');
                    const githubError = document.getElementById('github-error');
                    const githubPRs = document.getElementById('github-prs');
                    const lastSync = document.getElementById('last-sync');
                    const syncTime = document.getElementById('sync-time');
                    
                    githubLoading.style.display = 'none';
                    
                    if (message.error) {
                        githubError.textContent = message.error;
                        githubError.style.display = 'block';
                    } else {
                        githubError.style.display = 'none';
                        
                        if (message.prs && message.prs.length > 0) {
                            githubPRs.innerHTML = message.prs.map(pr => 
                                '<div class="github-pr" onclick="openGitHubPR(' + pr.number + ')">' +
                                    '<div class="pr-header">' +
                                        '<h4 class="pr-title">' + pr.title + '</h4>' +
                                        '<span class="pr-number">#' + pr.number + '</span>' +
                                    '</div>' +
                                    '<div class="pr-meta">' +
                                        '<span class="pr-status ' + pr.state + '">' + pr.state + '</span>' +
                                        '<span>by ' + pr.user.login + '</span>' +
                                        '<span>' + formatDate(pr.updated_at) + '</span>' +
                                    '</div>' +
                                '</div>'
                            ).join('');
                        } else {
                            githubPRs.innerHTML = '<p style="text-align: center; color: var(--vscode-descriptionForeground);">No pull requests found.</p>';
                        }
                        
                        // Update last sync time
                        syncTime.textContent = new Date().toLocaleTimeString();
                        lastSync.style.display = 'block';
                    }
                    break;
            }
        });
        
        function openGitHubPR(prNumber) {
            vscode.postMessage({
                command: 'openGitHubPR',
                prNumber: prNumber
            });
        }
    </script>
</body>
</html>`;
  }

  private _getHtmlForWebviewOld(webview: vscode.Webview) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kodus Tools</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 10px;
            margin: 0;
        }
        
        .container {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px;
        }
        
        .header h2 {
            margin: 0;
            color: var(--vscode-textLink-foreground);
        }
        
        .button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            transition: background-color 0.2s;
            width: 100%;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .button:active {
            background-color: var(--vscode-button-activeBackground);
        }
        
        .icon {
            font-size: 16px;
        }
        
        .section {
            margin-top: 15px;
        }
        
        .section-title {
            font-size: 12px;
            font-weight: 600;
            color: var(--vscode-foreground);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status {
            text-align: center;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            margin-top: 15px;
            padding: 8px;
            background-color: var(--vscode-editor-background);
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🚀 Kodus Tools</h2>
        </div>
        
        <div class="section">
            <div class="section-title">Quick Actions</div>
            <button class="button" onclick="formatJson()">
                <span class="icon">📄</span>
                Format JSON
            </button>
            <button class="button" onclick="convertCase()">
                <span class="icon">🔄</span>
                Convert Case
            </button>
            <button class="button" onclick="insertTimestamp()">
                <span class="icon">⏰</span>
                Insert Timestamp
            </button>
            <button class="button" onclick="insertSnippet()">
                <span class="icon">📝</span>
                Insert Snippet
            </button>
        </div>
        
        <div class="status">
            Ready to help! ✨
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function formatJson() {
            vscode.postMessage({
                command: 'formatJson'
            });
        }
        
        function convertCase() {
            vscode.postMessage({
                command: 'convertCase'
            });
        }
        
        function insertTimestamp() {
            vscode.postMessage({
                command: 'insertTimestamp'
            });
        }
        
        function insertSnippet() {
            vscode.postMessage({
                command: 'insertSnippet'
            });
        }
    </script>
</body>
</html>`;
  }

  private async _formatJson() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor found');
      return;
    }

    if (editor.document.languageId !== 'json') {
      vscode.window.showWarningMessage('Current file is not a JSON file');
      return;
    }

    const text = editor.document.getText();
    const parsedJson = JSON.parse(text);
    const formatted = JSON.stringify(parsedJson, null, 2);

    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      editor.document.uri,
      new vscode.Range(0, 0, editor.document.lineCount, 0),
      formatted
    );

    await vscode.workspace.applyEdit(edit);
    vscode.window.showInformationMessage('JSON formatted successfully!');
  }

  private async _convertCase() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor found');
      return;
    }

    if (editor.selection.isEmpty) {
      vscode.window.showWarningMessage('Please select text to convert');
      return;
    }

    const text = editor.document.getText(editor.selection);

    const items = [
      { label: 'UPPERCASE', description: 'Convert to uppercase' },
      { label: 'lowercase', description: 'Convert to lowercase' },
      { label: 'camelCase', description: 'Convert to camelCase' },
      { label: 'PascalCase', description: 'Convert to PascalCase' },
      { label: 'kebab-case', description: 'Convert to kebab-case' },
      { label: 'snake_case', description: 'Convert to snake_case' },
    ];

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select case conversion type',
    });

    if (!selected) return;

    // Import the converter function
    const { convertTextCase } = await import('@utils/caseConverter');
    const converted = convertTextCase(text, selected.label as CaseConverterType);

    await editor.edit(editBuilder => {
      editBuilder.replace(editor.selection, converted);
    });

    vscode.window.showInformationMessage(`Text converted to ${selected.label}`);
  }

  private async _insertTimestamp() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor found');
      return;
    }

    const timestamp = new Date().toISOString();
    await editor.edit(editBuilder => {
      editBuilder.insert(editor.selection.active, timestamp);
    });

    vscode.window.showInformationMessage('Timestamp inserted');
  }

  private async _insertSnippet() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor found');
      return;
    }

    const snippets = [
      { label: 'console.log', description: 'Insert console.log' },
      { label: 'function', description: 'Insert function' },
      { label: 'arrow-function', description: 'Insert arrow function' },
      { label: 'async-function', description: 'Insert async function' },
      { label: 'try-catch', description: 'Insert try-catch block' },
      { label: 'if-statement', description: 'Insert if statement' },
      { label: 'for-loop', description: 'Insert for loop' },
      { label: 'component', description: 'Insert React component' },
      { label: 'useEffect', description: 'Insert useEffect hook' },
      { label: 'useState', description: 'Insert useState hook' },
    ];

    const selected = await vscode.window.showQuickPick(snippets, {
      placeHolder: 'Select a snippet to insert',
    });

    if (!selected) return;

    // Create snippet string based on selection
    let snippetString: vscode.SnippetString;

    switch (selected.label) {
      case 'console.log':
        snippetString = new vscode.SnippetString('console.log($1);');
        break;
      case 'function':
        snippetString = new vscode.SnippetString(
          'function ${1:name}($2) {\n\t$3\n}'
        );
        break;
      case 'arrow-function':
        snippetString = new vscode.SnippetString(
          'const ${1:name} = ($2) => {\n\t$3\n};'
        );
        break;
      case 'async-function':
        snippetString = new vscode.SnippetString(
          'async function ${1:name}($2) {\n\t$3\n}'
        );
        break;
      case 'try-catch':
        snippetString = new vscode.SnippetString(
          'try {\n\t$1\n} catch (error) {\n\t$2\n}'
        );
        break;
      case 'if-statement':
        snippetString = new vscode.SnippetString('if ($1) {\n\t$2\n}');
        break;
      case 'for-loop':
        snippetString = new vscode.SnippetString(
          'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t$3\n}'
        );
        break;
      case 'component':
        snippetString = new vscode.SnippetString(
          'const ${1:ComponentName} = () => {\n\treturn (\n\t\t<div>\n\t\t\t$2\n\t\t</div>\n\t);\n};'
        );
        break;
      case 'useEffect':
        snippetString = new vscode.SnippetString(
          'useEffect(() => {\n\t$1\n}, [$2]);'
        );
        break;
      case 'useState':
        snippetString = new vscode.SnippetString(
          'const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState($2);'
        );
        break;
      default:
        return;
    }

    await editor.insertSnippet(snippetString);
    vscode.window.showInformationMessage(
      `Snippet "${selected.label}" inserted`
    );
  }

  private async _initializeAI(message: InitializeAICommand) {
    try {
      if (this.aiProvider) {
        this.aiProvider.disconnect();
      }

      this.aiProvider = this.aiManager.createProvider('main', {
        serverUrl: message.config.serverUrl,
        apiKey: message.config.apiKey,
        model: message.config.model,
        temperature: message.config.temperature,
        maxTokens: message.config.maxTokens,
      });

      // Configurar handlers para mensagens do AI
      this.aiProvider.onMessage(message => {
        if (this._view) {
          this._view.webview.postMessage({
            command: 'aiMessage',
            message,
          });
        }
      });

      await this.aiProvider.connect();

      if (this._view) {
        this._view.webview.postMessage({
          command: 'aiInitialized',
          connected: this.aiProvider.connected,
        });
      }
    } catch (error) {
      console.error('Failed to initialize AI:', error);
      if (this._view) {
        this._view.webview.postMessage({
          command: 'aiError',
          error: `Failed to initialize AI: ${error}`,
        });
      }
    }
  }

  private async _sendAIMessage(content: string, context?: Record<string, unknown>) {
    if (!this.aiProvider || !this.aiProvider.connected) {
      if (this._view) {
        this._view.webview.postMessage({
          command: 'aiError',
          error: 'AI service not connected',
        });
      }
      return;
    }

    try {
      await this.aiProvider.sendMessage(content, context);
    } catch (error) {
      console.error('Failed to send AI message:', error);
      if (this._view) {
        this._view.webview.postMessage({
          command: 'aiError',
          error: `Failed to send message: ${error}`,
        });
      }
    }
  }

  private _disconnectAI() {
    if (this.aiProvider) {
      this.aiProvider.disconnect();
      this.aiProvider = undefined;
    }

    if (this._view) {
      this._view.webview.postMessage({
        command: 'aiDisconnected',
      });
    }
  }

  private async _fetchGitHubPRs(webview: vscode.Webview, forceResync: boolean = false) {
    try {
      // TODO: Implement GitHub API call and define a proper type for PRs.
      // The `forceResync` flag should be used to either fetch fresh data or use a local cache.
      const prs: unknown[] = []; // Placeholder: This needs to be replaced with actual data fetching.

      // For now, return empty array - this should be replaced with actual GitHub API integration
      webview.postMessage({
        command: 'githubPRsResult',
        prs: prs,
      });
    } catch (error) {
      webview.postMessage({
        command: 'githubPRsResult',
        error: error instanceof Error ? error.message : 'Failed to fetch PRs',
      });
    }
  }

  private async _createGitHubPR(webview: vscode.Webview) {
    try {
      // This should create a PR via GitHub API
      vscode.window.showInformationMessage('Create PR functionality not yet implemented');
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to create PR: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async _autoMergePRs(webview: vscode.Webview) {
    try {
      // This should auto-merge PRs via GitHub API
      vscode.window.showInformationMessage('Auto merge functionality not yet implemented');
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to auto merge PRs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async _openGitHubPR(prNumber: number) {
    try {
      // This should open the PR in the browser
      const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');
      if (!gitExtension) {
        vscode.window.showWarningMessage('Git extension not found');
        return;
      }

      const git: GitExtension = gitExtension.isActive
        ? gitExtension.exports
        : await gitExtension.activate();

      const api: API = hasGetAPI(git) ? git.getAPI(1) : git;
      const repo: Repository | undefined = api?.repositories?.[0];

      if (repo) {
        const remoteUrl = repo.state.remotes[0]?.fetchUrl || repo.state.remotes[0]?.pushUrl;
        if (remoteUrl) {
          const url = remoteUrl.replace(/\.git$/, '').replace(/^git@github\.com:/, 'https://github.com/');
          const prUrl = `${url}/pull/${prNumber}`;
          vscode.env.openExternal(vscode.Uri.parse(prUrl));
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to open PR: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async _handleGitHubPRMessage(webview: vscode.Webview, message: GitHubPRMessage) {
    const command = message.command;
    const data = message.data || {};
    const forceResync = command === 'resync-github-prs' || data.force === true;

    try {
      // TODO: Implement GitHub API call and define a proper type for PRs.
      // The `forceResync` flag should be used to either fetch fresh data or use a local cache.
      const prs: unknown[] = []; // Placeholder: This needs to be replaced with actual data fetching.

      // Send response back to component
      webview.postMessage({
        command: `${command}-response`,
        result: { prs },
      });
    } catch (error) {
      webview.postMessage({
        command: `${command}-response`,
        error: error instanceof Error ? error.message : 'Failed to process request',
      });
    }
  }
}
