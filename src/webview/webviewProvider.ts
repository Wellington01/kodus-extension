import * as vscode from 'vscode';
import type {
  ExtensionContext,
  GitExtension,
  API,
  Repository,
  RefType,
  MainWebviewMessage,
  GitHubPRMessage,
  InitializeAICommand,
  GitHubPullRequest,
} from '@types';
import { hasGetAPI } from '@types';
import { AIManager, AIStreamProvider } from '@providers/aiStreamProvider';
import type { CaseConverterType } from '@utils/caseConverter';

interface GitHubApiPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  user: { login: string } | null;
  updated_at: string;
  html_url: string;
  merged_at?: string | null;
}

interface GitHubRepoInfo {
  owner: string;
  repo: string;
  branch?: string;
}

interface GitHubPRCacheEntry {
  prs: GitHubPullRequest[];
  fetchedAt: number;
}

type GitHubPRCache = Record<string, GitHubPRCacheEntry>;

export class KodusWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kodus-extension.webview';

  private _view?: vscode.WebviewView;
  private aiManager: AIManager;
  private aiProvider?: AIStreamProvider;
  private readonly githubPRCacheKey = 'kodus.github.prs.cache';
  private readonly githubPRCacheTtlMs = 5 * 60 * 1000;

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
          case 'executeCommand':
            this._executeCommand(message.commandName, message.args);
            return;
          case 'executeMcpTool':
            this._handleExecuteMcpTool(
              webviewView.webview,
              message.toolName,
              undefined
            );
            return;
          case 'create-github-pr':
            this._handleGitHubActionMessage(
              webviewView.webview,
              'create-github-pr',
              async () => {
                await this._createGitHubPR(webviewView.webview);
                return { ok: true };
              },
              typeof message.data?.requestId === 'string' ? message.data.requestId : undefined
            );
            return;
          case 'auto-merge-prs':
            this._handleGitHubActionMessage(
              webviewView.webview,
              'auto-merge-prs',
              async () => {
                await this._autoMergePRs(webviewView.webview);
                return { ok: true };
              },
              typeof message.data?.requestId === 'string' ? message.data.requestId : undefined
            );
            return;
          case 'open-github-pr': {
            if (message.data?.prNumber !== undefined) {
              this._handleGitHubActionMessage(
                webviewView.webview,
                'open-github-pr',
                async () => {
                  await this._openGitHubPR(message.data.prNumber, message.data?.url, message.data?.repo);
                  return { ok: true };
                },
                typeof message.data?.requestId === 'string' ? message.data.requestId : undefined
              );
            } else {
              this._handleGitHubActionMessage(
                webviewView.webview,
                'open-github-pr',
                async () => {
                  throw new Error('Missing PR number');
                },
                typeof message.data?.requestId === 'string' ? message.data.requestId : undefined
              );
            }
            return;
          }
          case 'fetch-github-prs':
          case 'resync-github-prs':
            this._handleGitHubPRMessage(webviewView.webview, message as GitHubPRMessage);
            return;
          case 'execute-mcp-tool':
            this._handleExecuteMcpTool(
              webviewView.webview,
              message.data?.toolName,
              typeof message.data?.requestId === 'string' ? message.data.requestId : undefined
            );
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
            
            // Reset loading div to original state
            loadingDiv.innerHTML = '<div class="spinner"></div> Syncing with GitHub...';
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
            
            // Set loading div content for resync operation
            loadingDiv.innerHTML = '<div class="spinner"></div> Resyncing with GitHub (clearing cache)...';
            loadingDiv.style.display = 'flex';
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
      const prs = await this._getGitHubPRs({ forceResync });
      webview.postMessage({
        command: 'githubPRsResult',
        prs,
      });
    } catch (error) {
      webview.postMessage({
        command: 'githubPRsResult',
        error: error instanceof Error ? error.message : 'Failed to fetch PRs',
      });
    }
  }

  private async _createGitHubPR(_webview: vscode.Webview) {
    try {
      const repository = await this._getGitRepository();
      if (!repository) {
        vscode.window.showWarningMessage('No Git repository found to create a PR');
        return;
      }

      const remoteUrl = this._getRepositoryRemoteUrl(repository);
      if (!remoteUrl) {
        vscode.window.showWarningMessage('No Git remote URL found to create a PR');
        return;
      }

      const repoInfo = this._parseGitHubRepo(remoteUrl);
      if (!repoInfo) {
        vscode.window.showWarningMessage('Remote is not a GitHub repository');
        return;
      }

      const headBranch = repository.state.HEAD?.name;
      if (!headBranch) {
        vscode.window.showWarningMessage('Unable to determine the current branch');
        return;
      }

      const baseBranch = this._guessBaseBranch(repository);
      if (baseBranch === headBranch) {
        vscode.window.showInformationMessage(
          'You are on the base branch. Switch to a feature branch to create a PR.'
        );
        return;
      }

      const baseEncoded = encodeURIComponent(baseBranch);
      const headEncoded = encodeURIComponent(headBranch);
      const compareUrl = `https://github.com/${repoInfo.owner}/${repoInfo.repo}/compare/${baseEncoded}...${headEncoded}?expand=1`;
      vscode.env.openExternal(vscode.Uri.parse(compareUrl));
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to create PR: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async _autoMergePRs(_webview: vscode.Webview) {
    try {
      const repository = await this._getGitRepository();
      if (!repository) {
        vscode.window.showWarningMessage('No Git repository found to auto-merge PRs');
        return;
      }

      const remoteUrl = this._getRepositoryRemoteUrl(repository);
      if (!remoteUrl) {
        vscode.window.showWarningMessage('No Git remote URL found to auto-merge PRs');
        return;
      }

      const repoInfo = this._parseGitHubRepo(remoteUrl);
      if (!repoInfo) {
        vscode.window.showWarningMessage('Remote is not a GitHub repository');
        return;
      }

      const headBranch = repository.state.HEAD?.name;
      if (!headBranch) {
        vscode.window.showWarningMessage('Unable to determine the current branch');
        return;
      }

      const pr = await this._getOpenPullRequestForBranch(repoInfo, headBranch);
      if (!pr) {
        vscode.window.showInformationMessage(`No open PR found for branch "${headBranch}".`);
        return;
      }

      const proceed = await vscode.window.showWarningMessage(
        `Merge PR #${pr.number}: ${pr.title}`,
        { modal: true },
        'Merge'
      );
      if (proceed !== 'Merge') {
        return;
      }

      const mergeMethod = await this._pickMergeMethod();
      if (!mergeMethod) {
        return;
      }

      await this._mergePullRequest(repoInfo, pr.number, mergeMethod);
      vscode.window.showInformationMessage(`PR #${pr.number} merged with ${mergeMethod}.`);
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to auto merge PRs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async _openGitHubPR(prNumber: number, url?: string, repoOverride?: string) {
    try {
      if (url) {
        vscode.env.openExternal(vscode.Uri.parse(url));
        return;
      }

      const repoInfoFromOverride = repoOverride ? this._parseGitHubRepo(repoOverride) : null;
      if (repoInfoFromOverride) {
        const prUrl = `https://github.com/${repoInfoFromOverride.owner}/${repoInfoFromOverride.repo}/pull/${prNumber}`;
        vscode.env.openExternal(vscode.Uri.parse(prUrl));
        return;
      }

      const repo = await this._getGitRepository();
      if (!repo) {
        vscode.window.showWarningMessage('No Git repository found to open PR');
        return;
      }

      const remoteUrl = this._getRepositoryRemoteUrl(repo);
      if (!remoteUrl) {
        vscode.window.showWarningMessage('No Git remote URL found to open PR');
        return;
      }

      const repoInfo = this._parseGitHubRepo(remoteUrl);
      if (!repoInfo) {
        vscode.window.showWarningMessage('Remote is not a GitHub repository');
        return;
      }

      const prUrl = `https://github.com/${repoInfo.owner}/${repoInfo.repo}/pull/${prNumber}`;
      vscode.env.openExternal(vscode.Uri.parse(prUrl));
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
    const requestId = typeof data.requestId === 'string' ? data.requestId : undefined;

    try {
      const prs = await this._getGitHubPRs({
        forceResync,
        repo: typeof data.repo === 'string' ? data.repo : undefined,
        branch: typeof data.branch === 'string' ? data.branch : undefined,
      });

      // Send response back to component
      webview.postMessage({
        command: `${command}-response`,
        result: { prs },
        requestId,
      });
    } catch (error) {
      webview.postMessage({
        command: `${command}-response`,
        error: error instanceof Error ? error.message : 'Failed to process request',
        requestId,
      });
    }
  }

  private async _handleGitHubActionMessage(
    webview: vscode.Webview,
    command: string,
    action: () => Promise<unknown>,
    requestId?: string
  ) {
    try {
      const result = await action();
      webview.postMessage({
        command: `${command}-response`,
        result: result ?? {},
        requestId,
      });
    } catch (error) {
      webview.postMessage({
        command: `${command}-response`,
        error: error instanceof Error ? error.message : 'Failed to process request',
        requestId,
      });
    }
  }

  private async _executeCommand(commandName: string, args?: unknown[]) {
    if (!commandName) {
      vscode.window.showWarningMessage('No command name provided');
      return;
    }

    try {
      await vscode.commands.executeCommand(commandName, ...(args ?? []));
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to execute command "${commandName}": ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async _handleExecuteMcpTool(
    webview: vscode.Webview,
    toolName?: string,
    requestId?: string
  ) {
    try {
      if (!toolName) {
        throw new Error('Missing MCP tool name');
      }

      const result = await this._executeMcpTool(toolName);
      webview.postMessage({
        command: 'mcpToolResult',
        toolName,
        result,
      });
      webview.postMessage({
        command: 'execute-mcp-tool-response',
        result,
        requestId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to execute MCP tool';
      webview.postMessage({
        command: 'mcpToolResult',
        toolName,
        error: message,
      });
      webview.postMessage({
        command: 'execute-mcp-tool-response',
        error: message,
        requestId,
      });
    }
  }

  private async _executeMcpTool(toolName: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error('No active editor found for MCP tool execution');
    }

    switch (toolName) {
      case 'code-analysis':
        return this._runCodeAnalysis(editor.document);
      case 'doc-generator':
        return this._runDocGenerator(editor.document);
      default:
        throw new Error(`Unknown MCP tool: ${toolName}`);
    }
  }

  private async _runCodeAnalysis(document: vscode.TextDocument) {
    const diagnostics = vscode.languages.getDiagnostics(document.uri);
    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      'vscode.executeDocumentSymbolProvider',
      document.uri
    );

    const counts = diagnostics.reduce(
      (acc, diag) => {
        switch (diag.severity) {
          case vscode.DiagnosticSeverity.Error:
            acc.errors += 1;
            break;
          case vscode.DiagnosticSeverity.Warning:
            acc.warnings += 1;
            break;
          case vscode.DiagnosticSeverity.Information:
            acc.infos += 1;
            break;
          case vscode.DiagnosticSeverity.Hint:
            acc.hints += 1;
            break;
        }
        return acc;
      },
      { errors: 0, warnings: 0, infos: 0, hints: 0 }
    );

    const topSymbols = (symbols ?? []).map(symbol => ({
      name: symbol.name,
      kind: vscode.SymbolKind[symbol.kind],
    }));

    return {
      document: {
        fileName: document.fileName,
        languageId: document.languageId,
        lineCount: document.lineCount,
        version: document.version,
      },
      diagnostics: counts,
      symbols: topSymbols,
    };
  }

  private async _runDocGenerator(document: vscode.TextDocument) {
    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      'vscode.executeDocumentSymbolProvider',
      document.uri
    );

    const outline = (symbols ?? []).map(symbol => `- ${symbol.name} (${vscode.SymbolKind[symbol.kind]})`);

    return {
      title: `Documentation outline for ${document.fileName.split(/[\\/]/).pop() ?? document.fileName}`,
      outline,
      summary: `Generated ${outline.length} symbol entries from the active document.`,
    };
  }

  private async _getGitHubPRs(options: {
    forceResync?: boolean;
    repo?: string;
    branch?: string;
  }): Promise<GitHubPullRequest[]> {
    const repoInfo = await this._resolveGitHubRepoInfo(options);
    const cacheKey = this._getGitHubPRCacheKey(repoInfo);

    if (!options.forceResync) {
      const cached = this._getCachedGitHubPRs(cacheKey);
      if (cached) {
        return cached;
      }
    } else {
      await this._clearGitHubPRCacheEntry(cacheKey);
    }

    const prs = await this._fetchGitHubPRsFromApi(repoInfo);
    await this._setGitHubPRCacheEntry(cacheKey, {
      prs,
      fetchedAt: Date.now(),
    });
    return prs;
  }

  private async _resolveGitHubRepoInfo(options: {
    repo?: string;
    branch?: string;
  }): Promise<GitHubRepoInfo> {
    if (options.repo) {
      const parsed = this._parseGitHubRepo(options.repo);
      if (parsed) {
        return {
          ...parsed,
          branch: options.branch,
        };
      }
    }

    const repository = await this._getGitRepository();
    if (!repository) {
      throw new Error('No Git repository found in the workspace');
    }

    const remoteUrl = this._getRepositoryRemoteUrl(repository);
    if (!remoteUrl) {
      throw new Error('No Git remote URL found for the repository');
    }

    const parsed = this._parseGitHubRepo(remoteUrl);
    if (!parsed) {
      throw new Error('Remote is not a GitHub repository');
    }

    return {
      ...parsed,
      branch: options.branch,
    };
  }

  private async _getGitRepository(): Promise<Repository | undefined> {
    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git');
    if (!gitExtension) {
      return undefined;
    }

    const git: GitExtension = gitExtension.isActive
      ? gitExtension.exports
      : await gitExtension.activate();

    const api: API = hasGetAPI(git) ? git.getAPI(1) : git;
    if (!api) {
      return undefined;
    }

    const activeUri = vscode.window.activeTextEditor?.document.uri;
    if (activeUri) {
      const activeRepo =
        api.getRepository(activeUri) ??
        api.getRepositoryFromUri?.(activeUri) ??
        api.getRepositoryFromPath?.(activeUri.fsPath);

      if (activeRepo) {
        return activeRepo;
      }
    }

    return api.repositories?.[0];
  }

  private _getRepositoryRemoteUrl(repository: Repository): string | undefined {
    const remotes = repository.state.remotes;
    if (!remotes.length) {
      return undefined;
    }

    const preferredRemote = remotes.find(remote => remote.name === 'origin') ?? remotes[0];
    return preferredRemote.fetchUrl || preferredRemote.pushUrl;
  }

  private _parseGitHubRepo(input: string): { owner: string; repo: string } | null {
    const normalized = input.trim().replace(/\.git$/i, '').replace(/\/$/, '');
    const patterns = [
      /^git@github\.com:([^/]+)\/([^/]+)$/i,
      /^ssh:\/\/git@github\.com\/([^/]+)\/([^/]+)$/i,
      /^git:\/\/github\.com\/([^/]+)\/([^/]+)$/i,
      /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)$/i,
      /^github\.com\/([^/]+)\/([^/]+)$/i,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(normalized);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
    }

    const directMatch = /^([^/]+)\/([^/]+)$/.exec(normalized);
    if (directMatch) {
      return { owner: directMatch[1], repo: directMatch[2] };
    }

    return null;
  }

  private async _fetchGitHubPRsFromApi(repoInfo: GitHubRepoInfo): Promise<GitHubPullRequest[]> {
    const url = this._buildGitHubPullsUrl(repoInfo);

    let token = await this._getGitHubAuthToken(false);
    let response = await this._requestGitHub(url, token);

    if ((response.status === 401 || response.status === 403) && !token) {
      token = await this._getGitHubAuthToken(true);
      response = await this._requestGitHub(url, token);
    }

    if (!response.ok) {
      const errorMessage = await this._getGitHubErrorMessage(response);
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as GitHubApiPullRequest[];
    return data.map(pr => this._normalizeGitHubPR(pr));
  }

  private async _getOpenPullRequestForBranch(
    repoInfo: GitHubRepoInfo,
    headBranch: string
  ): Promise<GitHubPullRequest | null> {
    const url = new URL(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/pulls`);
    url.searchParams.set('state', 'open');
    url.searchParams.set('head', `${repoInfo.owner}:${headBranch}`);
    url.searchParams.set('per_page', '1');

    let token = await this._getGitHubAuthToken(false);
    let response = await this._requestGitHub(url.toString(), token);

    if ((response.status === 401 || response.status === 403) && !token) {
      token = await this._getGitHubAuthToken(true);
      response = await this._requestGitHub(url.toString(), token);
    }

    if (!response.ok) {
      const errorMessage = await this._getGitHubErrorMessage(response);
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as GitHubApiPullRequest[];
    if (!data.length) {
      return null;
    }

    return this._normalizeGitHubPR(data[0]);
  }

  private async _mergePullRequest(
    repoInfo: GitHubRepoInfo,
    prNumber: number,
    mergeMethod: 'merge' | 'squash' | 'rebase'
  ) {
    const token = await this._getGitHubAuthToken(true);
    if (!token) {
      throw new Error('GitHub authentication is required to merge pull requests.');
    }

    const url = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/pulls/${prNumber}/merge`;
    const response = await this._requestGitHub(url, token, {
      method: 'PUT',
      body: JSON.stringify({ merge_method: mergeMethod }),
    });

    if (!response.ok) {
      const errorMessage = await this._getGitHubErrorMessage(response);
      throw new Error(errorMessage);
    }
  }

  private async _pickMergeMethod(): Promise<'merge' | 'squash' | 'rebase' | undefined> {
    const selection = await vscode.window.showQuickPick(
      [
        {
          label: 'Merge',
          description: 'Create a merge commit',
          value: 'merge' as const,
        },
        {
          label: 'Squash',
          description: 'Squash and merge',
          value: 'squash' as const,
        },
        {
          label: 'Rebase',
          description: 'Rebase and merge',
          value: 'rebase' as const,
        },
      ],
      {
        placeHolder: 'Select merge method',
      }
    );

    return selection?.value;
  }

  private _buildGitHubPullsUrl(repoInfo: GitHubRepoInfo): string {
    const url = new URL(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/pulls`);
    url.searchParams.set('state', 'all');
    url.searchParams.set('sort', 'updated');
    url.searchParams.set('direction', 'desc');
    url.searchParams.set('per_page', '30');
    if (repoInfo.branch) {
      url.searchParams.set('base', repoInfo.branch);
    }
    return url.toString();
  }

  private async _requestGitHub(
    url: string,
    token?: string,
    options?: { method?: string; body?: string }
  ): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'kodus-extension',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (options?.body) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(url, {
      headers,
      method: options?.method ?? 'GET',
      body: options?.body,
    });
  }

  private async _getGitHubAuthToken(createIfNone: boolean): Promise<string | undefined> {
    try {
      const session = await vscode.authentication.getSession('github', ['repo'], {
        createIfNone,
      });
      return session?.accessToken;
    } catch {
      return undefined;
    }
  }

  private async _getGitHubErrorMessage(response: Response): Promise<string> {
    if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
      return 'GitHub API rate limit exceeded. Sign in to GitHub to increase the limit.';
    }

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) {
        return `GitHub API error: ${payload.message}`;
      }
    } catch {
      // ignore JSON parse errors
    }

    return `GitHub API request failed with status ${response.status}`;
  }

  private _normalizeGitHubPR(pr: GitHubApiPullRequest): GitHubPullRequest {
    const state =
      pr.state === 'open' ? 'open' : pr.merged_at ? 'merged' : 'closed';

    return {
      id: pr.id,
      number: pr.number,
      title: pr.title,
      state,
      user: {
        login: pr.user?.login ?? 'unknown',
      },
      updated_at: pr.updated_at,
      html_url: pr.html_url,
    };
  }

  private _guessBaseBranch(repository: Repository): string {
    const refs = repository.state.refs
      .filter(ref => ref.type === RefType.RemoteHead && ref.name)
      .map(ref => ref.name as string);

    const preferred = ['origin/main', 'origin/master', 'upstream/main', 'upstream/master'];
    for (const candidate of preferred) {
      if (refs.includes(candidate)) {
        return candidate.split('/').slice(1).join('/') || candidate;
      }
    }

    const originRef = refs.find(ref => ref.startsWith('origin/'));
    if (originRef) {
      return originRef.split('/').slice(1).join('/') || originRef;
    }

    const fallback = refs[0];
    if (fallback) {
      return fallback.split('/').slice(1).join('/') || fallback;
    }

    return 'main';
  }

  private _getGitHubPRCacheKey(repoInfo: GitHubRepoInfo): string {
    return `${repoInfo.owner}/${repoInfo.repo}#${repoInfo.branch ?? ''}`;
  }

  private _getGitHubPRCache(): GitHubPRCache {
    return this.context.workspaceState.get<GitHubPRCache>(this.githubPRCacheKey, {});
  }

  private _getCachedGitHubPRs(cacheKey: string): GitHubPullRequest[] | null {
    const cache = this._getGitHubPRCache();
    const entry = cache[cacheKey];
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.fetchedAt > this.githubPRCacheTtlMs) {
      return null;
    }

    return entry.prs;
  }

  private async _setGitHubPRCacheEntry(cacheKey: string, entry: GitHubPRCacheEntry) {
    const cache = this._getGitHubPRCache();
    cache[cacheKey] = entry;
    await this.context.workspaceState.update(this.githubPRCacheKey, cache);
  }

  private async _clearGitHubPRCacheEntry(cacheKey: string) {
    const cache = this._getGitHubPRCache();
    if (cache[cacheKey]) {
      delete cache[cacheKey];
      await this.context.workspaceState.update(this.githubPRCacheKey, cache);
    }
  }
}
