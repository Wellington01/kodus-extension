import * as vscode from 'vscode';
import type { ExtensionContext } from '@types';

export class KodusWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'kodus-extension.webview';

  private _view?: vscode.WebviewView;

  constructor(private readonly context: ExtensionContext) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'media')
      ]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      message => {
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
    edit.replace(editor.document.uri, new vscode.Range(0, 0, editor.document.lineCount, 0), formatted);
    
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
      { label: 'snake_case', description: 'Convert to snake_case' }
    ];

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select case conversion type'
    });

    if (!selected) return;

    // Import the converter function
    const { convertTextCase } = await import('@utils/caseConverter');
    const converted = convertTextCase(text, selected.label as any);
    
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
      { label: 'useState', description: 'Insert useState hook' }
    ];

    const selected = await vscode.window.showQuickPick(snippets, {
      placeHolder: 'Select a snippet to insert'
    });

    if (!selected) return;

    // Create snippet string based on selection
    let snippetString: vscode.SnippetString;
    
    switch (selected.label) {
      case 'console.log':
        snippetString = new vscode.SnippetString('console.log($1);');
        break;
      case 'function':
        snippetString = new vscode.SnippetString('function ${1:name}($2) {\n\t$3\n}');
        break;
      case 'arrow-function':
        snippetString = new vscode.SnippetString('const ${1:name} = ($2) => {\n\t$3\n};');
        break;
      case 'async-function':
        snippetString = new vscode.SnippetString('async function ${1:name}($2) {\n\t$3\n}');
        break;
      case 'try-catch':
        snippetString = new vscode.SnippetString('try {\n\t$1\n} catch (error) {\n\t$2\n}');
        break;
      case 'if-statement':
        snippetString = new vscode.SnippetString('if ($1) {\n\t$2\n}');
        break;
      case 'for-loop':
        snippetString = new vscode.SnippetString('for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t$3\n}');
        break;
      case 'component':
        snippetString = new vscode.SnippetString('const ${1:ComponentName} = () => {\n\treturn (\n\t\t<div>\n\t\t\t$2\n\t\t</div>\n\t);\n};');
        break;
      case 'useEffect':
        snippetString = new vscode.SnippetString('useEffect(() => {\n\t$1\n}, [$2]);');
        break;
      case 'useState':
        snippetString = new vscode.SnippetString('const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState($2);');
        break;
      default:
        return;
    }

    await editor.insertSnippet(snippetString);
    vscode.window.showInformationMessage(`Snippet "${selected.label}" inserted`);
  }
}
