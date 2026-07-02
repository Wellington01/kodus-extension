import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Serviço avançado para análise de código com AST, diff e LSP
 */
export class AdvancedAnalysisService {
  constructor(private context: vscode.ExtensionContext) {}

  /**
   * 🔥 ACESSAR AST (Abstract Syntax Tree)
   */
  async getASTInfo(document: vscode.TextDocument) {
    const languageId = document.languageId;
    const content = document.getText();

    return {
      // Informações básicas do documento
      document: {
        fileName: document.fileName,
        languageId,
        lineCount: document.lineCount,
        version: document.version,
      },

      // AST através de Language Server Protocol
      ast: await this.getASTFromLSP(document),

      // Análise sintática manual para linguagens suportadas
      manualAST: this.parseASTManually(content, languageId),

      // Informações de tokens e símbolos
      symbols: await this.getDocumentSymbols(document),
      tokens: await this.getTokens(document),
    };
  }

  /**
   * 🔥 ACESSAR DIFF (Diferenças entre arquivos)
   */
  async getDiffInfo() {
    return {
      // Diff do Git (se disponível)
      gitDiff: await this.getGitDiff(),

      // Comparação entre versões do arquivo
      documentDiff: await this.getDocumentDiff(),

      // Comparação entre arquivos
      fileDiff: await this.getFileDiff(),

      // Histórico de mudanças
      changeHistory: await this.getChangeHistory(),
    };
  }

  /**
   * 🔥 ACESSAR LSP (Language Server Protocol)
   */
  async getLSPInfo(document: vscode.TextDocument) {
    return {
      // Informações do Language Server
      languageServer: await this.getLanguageServerInfo(document),

      // Completions disponíveis
      completions: await this.getCompletions(document),

      // Hover information
      hoverInfo: await this.getHoverInfo(document),

      // Signature help
      signatureHelp: await this.getSignatureHelp(document),

      // Code actions
      codeActions: await this.getCodeActions(document),

      // References
      references: await this.getReferences(document),

      // Definitions
      definitions: await this.getDefinitions(document),
    };
  }

  /**
   * Obter AST através do LSP
   */
  private async getASTFromLSP(document: vscode.TextDocument) {
    try {
      // Usar o TypeScript Language Server se disponível
      const tsExtension = vscode.extensions.getExtension(
        'vscode.typescript-language-features'
      );

      if (tsExtension && tsExtension.isActive) {
        // Executar comando do TypeScript para obter AST
        const result = await vscode.commands.executeCommand(
          'typescript.tsserverRequest',
          'getAST',
          {
            file: document.uri.toString(),
          }
        );
        return result;
      }

      // Fallback: usar diagnósticos para inferir estrutura
      const diagnostics = vscode.languages.getDiagnostics(document.uri);
      return {
        diagnostics: diagnostics.map(diag => ({
          message: diag.message,
          range: diag.range,
          severity: diag.severity,
          source: diag.source,
        })),
        inferred: true,
      };
    } catch (error) {
      return { error: error.message, available: false };
    }
  }

  /**
   * Análise AST manual para linguagens suportadas
   */
  private parseASTManually(content: string, languageId: string) {
    switch (languageId) {
      case 'json':
        return this.parseJSONAST(content);
      case 'javascript':
      case 'typescript':
        return this.parseJavaScriptAST(content);
      case 'python':
        return this.parsePythonAST(content);
      default:
        return { supported: false, languageId };
    }
  }

  /**
   * Parser AST para JSON
   */
  private parseJSONAST(content: string) {
    try {
      const parsed = JSON.parse(content);
      return {
        type: 'JSON',
        structure: this.analyzeJSONStructure(parsed),
        keys: this.extractJSONKeys(parsed),
        values: this.extractJSONValues(parsed),
      };
    } catch (error) {
      return { error: error.message, valid: false };
    }
  }

  /**
   * Parser AST para JavaScript/TypeScript
   */
  private parseJavaScriptAST(content: string) {
    // Análise básica de estrutura JavaScript
    const functions = this.extractFunctions(content);
    const classes = this.extractClasses(content);
    const imports = this.extractImports(content);
    const variables = this.extractVariables(content);

    return {
      type: 'JavaScript/TypeScript',
      functions,
      classes,
      imports,
      variables,
      complexity: this.calculateComplexity(content),
    };
  }

  /**
   * Parser AST para Python
   */
  private parsePythonAST(content: string) {
    const functions = this.extractPythonFunctions(content);
    const classes = this.extractPythonClasses(content);
    const imports = this.extractPythonImports(content);

    return {
      type: 'Python',
      functions,
      classes,
      imports,
      indentation: this.analyzeIndentation(content),
    };
  }

  /**
   * Obter símbolos do documento
   */
  private async getDocumentSymbols(document: vscode.TextDocument) {
    try {
      const symbols = await vscode.commands.executeCommand(
        'vscode.executeDocumentSymbolProvider',
        document.uri
      );
      return symbols;
    } catch (error) {
      return { error: error.message, available: false };
    }
  }

  /**
   * Obter tokens do documento
   */
  private async getTokens(document: vscode.TextDocument) {
    try {
      // Usar o token provider se disponível
      const tokens = await vscode.commands.executeCommand(
        'vscode.executeTokenProvider',
        document.uri
      );
      return tokens;
    } catch (error) {
      // Fallback: análise manual de tokens
      return this.analyzeTokensManually(
        document.getText(),
        document.languageId
      );
    }
  }

  /**
   * Obter diff do Git
   */
  private async getGitDiff() {
    try {
      const gitExtension = vscode.extensions.getExtension('vscode.git');
      if (!gitExtension || !gitExtension.isActive) {
        return { available: false, reason: 'Git extension not active' };
      }

      const git = gitExtension.exports;
      const repositories = git.repositories;

      if (repositories.length === 0) {
        return { available: false, reason: 'No Git repositories' };
      }

      const repo = repositories[0];
      const changes = repo.state.workingTreeChanges;
      const stagedChanges = repo.state.indexChanges;

      return {
        available: true,
        workingTreeChanges: changes.map((change: any) => ({
          uri: change.uri.toString(),
          status: change.status,
          originalUri: change.originalUri?.toString(),
        })),
        stagedChanges: stagedChanges.map((change: any) => ({
          uri: change.uri.toString(),
          status: change.status,
          originalUri: change.originalUri?.toString(),
        })),
        head: repo.state.HEAD,
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Obter diff entre versões do documento
   */
  private async getDocumentDiff() {
    try {
      // Comparar com versão anterior se disponível
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return { available: false, reason: 'No active editor' };
      }

      const document = editor.document;
      const currentContent = document.getText();

      // Tentar obter versão anterior do Git
      const gitDiff = await this.getGitDiff();
      if (gitDiff.available) {
        return {
          available: true,
          currentContent,
          gitDiff: gitDiff,
        };
      }

      return {
        available: false,
        reason: 'No previous version available',
        currentContent,
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Obter diff entre arquivos
   */
  private async getFileDiff() {
    try {
      // Comparar arquivo atual com outro arquivo
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return { available: false, reason: 'No active editor' };
      }

      const currentFile = editor.document.uri;
      const currentContent = editor.document.getText();

      // Buscar arquivos similares no workspace
      const similarFiles = await this.findSimilarFiles(currentFile);

      return {
        available: true,
        currentFile: currentFile.toString(),
        similarFiles,
        currentContent,
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Obter histórico de mudanças
   */
  private async getChangeHistory() {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return { available: false, reason: 'No active editor' };
      }

      const document = editor.document;
      const changes = document
        .getText()
        .split('\n')
        .map((line, index) => ({
          lineNumber: index + 1,
          content: line,
          length: line.length,
        }));

      return {
        available: true,
        totalLines: changes.length,
        changes,
        documentVersion: document.version,
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Obter informações do Language Server
   */
  private async getLanguageServerInfo(document: vscode.TextDocument) {
    const languageId = document.languageId;

    // Verificar se há Language Server ativo para esta linguagem
    const extensions = vscode.extensions.all;
    const languageServers = extensions.filter(ext =>
      ext.packageJSON.contributes?.languages?.some(
        (lang: any) => lang.id === languageId
      )
    );

    return {
      languageId,
      activeLanguageServers: languageServers.map(ext => ({
        id: ext.id,
        displayName: ext.packageJSON.displayName,
        isActive: ext.isActive,
      })),
      diagnostics: vscode.languages.getDiagnostics(document.uri),
    };
  }

  /**
   * Obter completions
   */
  private async getCompletions(document: vscode.TextDocument) {
    try {
      const position = new vscode.Position(0, 0);
      const completions = await vscode.commands.executeCommand(
        'vscode.executeCompletionItemProvider',
        document.uri,
        position
      );
      return completions;
    } catch (error) {
      return { error: error.message, available: false };
    }
  }

  /**
   * Obter hover information
   */
  private async getHoverInfo(document: vscode.TextDocument) {
    try {
      const position = new vscode.Position(0, 0);
      const hover = await vscode.commands.executeCommand(
        'vscode.executeHoverProvider',
        document.uri,
        position
      );
      return hover;
    } catch (error) {
      return { error: error.message, available: false };
    }
  }

  /**
   * Obter signature help
   */
  private async getSignatureHelp(document: vscode.TextDocument) {
    try {
      const position = new vscode.Position(0, 0);
      const signatureHelp = await vscode.commands.executeCommand(
        'vscode.executeSignatureHelpProvider',
        document.uri,
        position
      );
      return signatureHelp;
    } catch (error) {
      return { error: error.message, available: false };
    }
  }

  /**
   * Obter code actions
   */
  private async getCodeActions(document: vscode.TextDocument) {
    try {
      const range = new vscode.Range(0, 0, 0, 0);
      const codeActions = await vscode.commands.executeCommand(
        'vscode.executeCodeActionProvider',
        document.uri,
        range
      );
      return codeActions;
    } catch (error) {
      return { error: error.message, available: false };
    }
  }

  /**
   * Obter references
   */
  private async getReferences(document: vscode.TextDocument) {
    try {
      const position = new vscode.Position(0, 0);
      const references = await vscode.commands.executeCommand(
        'vscode.executeReferenceProvider',
        document.uri,
        position
      );
      return references;
    } catch (error) {
      return { error: error.message, available: false };
    }
  }

  /**
   * Obter definitions
   */
  private async getDefinitions(document: vscode.TextDocument) {
    try {
      const position = new vscode.Position(0, 0);
      const definitions = await vscode.commands.executeCommand(
        'vscode.executeDefinitionProvider',
        document.uri,
        position
      );
      return definitions;
    } catch (error) {
      return { error: error.message, available: false };
    }
  }

  // Métodos auxiliares para análise manual
  private analyzeJSONStructure(obj: any, depth = 0): any {
    if (depth > 5) return { type: 'deep', truncated: true };

    if (Array.isArray(obj)) {
      return {
        type: 'array',
        length: obj.length,
        items: obj
          .slice(0, 3)
          .map(item => this.analyzeJSONStructure(item, depth + 1)),
      };
    } else if (obj && typeof obj === 'object') {
      return {
        type: 'object',
        keys: Object.keys(obj),
        properties: Object.keys(obj)
          .slice(0, 5)
          .reduce((acc: any, key: string) => {
            acc[key] = this.analyzeJSONStructure(obj[key], depth + 1);
            return acc;
          }, {}),
      };
    } else {
      return { type: typeof obj, value: obj };
    }
  }

  private extractJSONKeys(obj: any, prefix = ''): string[] {
    const keys: string[] = [];

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        keys.push(...this.extractJSONKeys(item, `${prefix}[${index}]`));
      });
    } else if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        keys.push(prefix ? `${prefix}.${key}` : key);
        keys.push(
          ...this.extractJSONKeys(obj[key], prefix ? `${prefix}.${key}` : key)
        );
      });
    }

    return keys;
  }

  private extractJSONValues(obj: any): any[] {
    const values: any[] = [];

    if (Array.isArray(obj)) {
      obj.forEach(item => values.push(...this.extractJSONValues(item)));
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(value =>
        values.push(...this.extractJSONValues(value))
      );
    } else {
      values.push(obj);
    }

    return values;
  }

  private extractFunctions(content: string) {
    const functionRegex = /function\s+(\w+)\s*\(/g;
    const arrowFunctionRegex = /const\s+(\w+)\s*=\s*\(/g;
    const methodsRegex = /(\w+)\s*\([^)]*\)\s*{/g;

    const functions: string[] = [];
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }

    while ((match = arrowFunctionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }

    return functions;
  }

  private extractClasses(content: string) {
    const classRegex = /class\s+(\w+)/g;
    const classes: string[] = [];
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }

    return classes;
  }

  private extractImports(content: string) {
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private extractVariables(content: string) {
    const varRegex = /(?:const|let|var)\s+(\w+)/g;
    const variables: string[] = [];
    let match;

    while ((match = varRegex.exec(content)) !== null) {
      variables.push(match[1]);
    }

    return variables;
  }

  private calculateComplexity(content: string): number {
    // Análise básica de complexidade ciclomática
    const ifStatements = (content.match(/\bif\s*\(/g) || []).length;
    const forLoops = (content.match(/\bfor\s*\(/g) || []).length;
    const whileLoops = (content.match(/\bwhile\s*\(/g) || []).length;
    const switchStatements = (content.match(/\bswitch\s*\(/g) || []).length;
    const catchBlocks = (content.match(/\bcatch\s*\(/g) || []).length;

    return (
      1 + ifStatements + forLoops + whileLoops + switchStatements + catchBlocks
    );
  }

  private extractPythonFunctions(content: string) {
    const functionRegex = /def\s+(\w+)\s*\(/g;
    const functions: string[] = [];
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }

    return functions;
  }

  private extractPythonClasses(content: string) {
    const classRegex = /class\s+(\w+)/g;
    const classes: string[] = [];
    let match;

    while ((match = classRegex.exec(content)) !== null) {
      classes.push(match[1]);
    }

    return classes;
  }

  private extractPythonImports(content: string) {
    const importRegex = /import\s+(\w+)|from\s+(\w+)\s+import/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1] || match[2]);
    }

    return imports;
  }

  private analyzeIndentation(content: string) {
    const lines = content.split('\n');
    const indentations = lines.map(line => {
      const match = line.match(/^(\s*)/);
      return match ? match[1].length : 0;
    });

    return {
      average: indentations.reduce((a, b) => a + b, 0) / indentations.length,
      max: Math.max(...indentations),
      min: Math.min(...indentations),
      inconsistent: new Set(indentations).size > 1,
    };
  }

  private analyzeTokensManually(content: string, languageId: string) {
    // Análise básica de tokens
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const lines = content.split('\n');
    const characters = content.length;

    return {
      wordCount: words.length,
      lineCount: lines.length,
      characterCount: characters,
      averageWordsPerLine: words.length / lines.length,
      languageId,
    };
  }

  private async findSimilarFiles(currentFile: vscode.Uri) {
    try {
      const workspace = vscode.workspace;
      const files = await workspace.findFiles('**/*', null, 10);

      return files
        .filter(file => file.toString() !== currentFile.toString())
        .slice(0, 5)
        .map(file => file.toString());
    } catch (error) {
      return [];
    }
  }

  /**
   * Encontrar linhas duplicadas em um documento.
   */
  findDuplicateLines(content: string): string[] {
    const lines = content.split('\n');
    const duplicates: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      for (let j = 0; j < lines.length; j++) {
        if (i !== j && lines[i] === lines[j] && lines[i].trim().length > 0) {
          duplicates.push(lines[i]);
        }
      }
    }

    return duplicates;
  }

  /**
   * Obter todas as informações avançadas
   */
  async getAllAdvancedInfo() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return { error: 'No active editor found' };
    }

    const document = editor.document;

    return {
      ast: await this.getASTInfo(document),
      diff: await this.getDiffInfo(),
      lsp: await this.getLSPInfo(document),
      timestamp: Date.now(),
    };
  }
}
