import * as vscode from 'vscode';

/**
 * Utilitário para acessar informações técnicas do workspace e IDE
 */
export class WorkspaceInfoService {
  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Obter informações do workspace
   */
  async getWorkspaceInfo() {
    const workspace = vscode.workspace;

    return {
      // Informações básicas do workspace
      workspaceFolders: workspace.workspaceFolders?.map(folder => ({
        name: folder.name,
        uri: folder.uri.toString(),
        index: folder.index,
      })),

      // Configurações do workspace
      workspaceConfiguration: {
        // Configurações do usuário
        userSettings: workspace.getConfiguration(),
        // Configurações do workspace
        workspaceSettings: workspace.getConfiguration(
          undefined,
          workspace.workspaceFolders?.[0]
        ),
        // Configurações específicas de linguagem
        languageSettings: workspace.getConfiguration(
          '',
          workspace.workspaceFolders?.[0]
        ),
      },

      // Informações dos arquivos
      openDocuments: workspace.textDocuments.map(doc => ({
        fileName: doc.fileName,
        languageId: doc.languageId,
        isDirty: doc.isDirty,
        isClosed: doc.isClosed,
        lineCount: doc.lineCount,
        uri: doc.uri.toString(),
      })),

      // Configurações de extensões
      extensionSettings: {
        // Configurações da própria extensão
        kodusSettings: workspace.getConfiguration('kodus-extension'),
        // Configurações de outras extensões
        eslintSettings: workspace.getConfiguration('eslint'),
        prettierSettings: workspace.getConfiguration('prettier'),
        typescriptSettings: workspace.getConfiguration('typescript'),
      },
    };
  }

  /**
   * Obter diagnósticos (erros, warnings, info) de todos os arquivos
   */
  async getDiagnostics() {
    const diagnostics = vscode.languages.getDiagnostics();
    const buildEntry = (uri: vscode.Uri, diags: readonly vscode.Diagnostic[]) => ({
      uri: uri.toString(),
      fileName: uri.fsPath,
      diagnostics: diags.map(diag => ({
        message: diag.message,
        severity: this.getSeverityName(diag.severity),
        source: diag.source,
        code: diag.code,
        range: {
          start: {
            line: diag.range.start.line,
            character: diag.range.start.character,
          },
          end: {
            line: diag.range.end.line,
            character: diag.range.end.character,
          },
        },
        relatedInformation: diag.relatedInformation?.map(info => ({
          message: info.message,
          location: {
            uri: info.location.uri.toString(),
            range: info.location.range,
          },
        })),
      })),
    });
    const result: ReturnType<typeof buildEntry>[] = [];

    for (const [uri, diags] of diagnostics) {
      result.push(buildEntry(uri, diags));
    }

    return result;
  }

  /**
   * Obter informações do editor ativo
   */
  getActiveEditorInfo() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return null;

    return {
      // Informações do documento
      document: {
        fileName: editor.document.fileName,
        languageId: editor.document.languageId,
        uri: editor.document.uri.toString(),
        isDirty: editor.document.isDirty,
        isClosed: editor.document.isClosed,
        lineCount: editor.document.lineCount,
        version: editor.document.version,
      },

      // Informações da seleção
      selection: {
        start: {
          line: editor.selection.start.line,
          character: editor.selection.start.character,
        },
        end: {
          line: editor.selection.end.line,
          character: editor.selection.end.character,
        },
        isEmpty: editor.selection.isEmpty,
        isReversed: editor.selection.isReversed,
      },

      // Informações visuais
      visibleRanges: editor.visibleRanges.map(range => ({
        start: { line: range.start.line, character: range.start.character },
        end: { line: range.end.line, character: range.end.character },
      })),

      // Opções do editor
      options: editor.options,

      // View column
      viewColumn: editor.viewColumn,
    };
  }

  /**
   * Obter informações de linguagens instaladas
   */
  async getLanguageInfo() {
    const languages = vscode.languages.getLanguages();

    return {
      installedLanguages: languages,
      // Informações sobre extensões de linguagem
      languageExtensions: await this.getLanguageExtensions(),
    };
  }

  /**
   * Obter informações de extensões instaladas
   */
  async getExtensionsInfo() {
    const extensions = vscode.extensions.all;

    return {
      totalExtensions: extensions.length,
      enabledExtensions: extensions.filter(ext => ext.isActive),
      extensions: extensions.map(ext => ({
        id: ext.id,
        displayName: ext.packageJSON.displayName,
        version: ext.packageJSON.version,
        publisher: ext.packageJSON.publisher,
        isActive: ext.isActive,
        extensionPath: ext.extensionPath,
        extensionUri: ext.extensionUri.toString(),
        packageJSON: {
          name: ext.packageJSON.name,
          version: ext.packageJSON.version,
          engines: ext.packageJSON.engines,
          categories: ext.packageJSON.categories,
          contributes: ext.packageJSON.contributes,
        },
      })),
    };
  }

  /**
   * Obter informações de configuração do TypeScript/JavaScript
   */
  async getTypeScriptInfo() {
    const tsExtension = vscode.extensions.getExtension(
      'vscode.typescript-language-features'
    );

    if (!tsExtension) return null;

    return {
      isActive: tsExtension.isActive,
      version: tsExtension.packageJSON.version,
      // Configurações do TypeScript
      typescriptConfig: vscode.workspace.getConfiguration('typescript'),
      // Configurações do JavaScript
      javascriptConfig: vscode.workspace.getConfiguration('javascript'),
      // Configurações de formatação
      formattingConfig: vscode.workspace.getConfiguration(
        'editor.formatOnSave'
      ),
    };
  }

  /**
   * Obter informações de linters e formatters
   */
  async getLinterInfo() {
    return {
      // ESLint
      eslint: {
        config: vscode.workspace.getConfiguration('eslint'),
        isEnabled: vscode.workspace
          .getConfiguration('eslint')
          .get('enable', false),
      },

      // Prettier
      prettier: {
        config: vscode.workspace.getConfiguration('prettier'),
        isEnabled: vscode.workspace
          .getConfiguration('prettier')
          .get('enable', false),
      },

      // EditorConfig
      editorConfig: vscode.workspace.getConfiguration('editor'),

      // Configurações de formatação
      formatting: {
        formatOnSave: vscode.workspace
          .getConfiguration('editor')
          .get('formatOnSave'),
        formatOnPaste: vscode.workspace
          .getConfiguration('editor')
          .get('formatOnPaste'),
        formatOnType: vscode.workspace
          .getConfiguration('editor')
          .get('formatOnType'),
      },
    };
  }

  /**
   * Obter informações de build e tasks
   */
  async getBuildInfo() {
    const tasks = await vscode.tasks.fetchTasks();

    return {
      tasks: tasks.map(task => ({
        name: task.name,
        source: task.source,
        group: task.group,
        presentationOptions: task.presentationOptions,
        runOptions: task.runOptions,
        definition: task.definition,
      })),

      // Configurações de build
      buildConfig: vscode.workspace.getConfiguration('tasks'),

      // Configurações de terminal
      terminalConfig: vscode.workspace.getConfiguration('terminal'),
    };
  }

  /**
   * Obter informações de Git
   */
  async getGitInfo() {
    const gitExtension = vscode.extensions.getExtension('vscode.git');

    if (!gitExtension || !gitExtension.isActive) return null;

    const git = gitExtension.exports;
    const repositories = git.repositories;

    return {
      repositories: repositories.map((repo: any) => ({
        rootUri: repo.rootUri.toString(),
        state: repo.state,
        // Informações do repositório
        head: repo.state.HEAD,
        remotes: repo.state.remotes,
        submodules: repo.state.submodules,
        refs: repo.state.refs,
      })),
    };
  }

  /**
   * Obter informações de debug
   */
  async getDebugInfo() {
    return {
      // Configurações de debug
      debugConfig: vscode.workspace.getConfiguration('debug'),

      // Breakpoints
      breakpoints: vscode.debug.breakpoints.map(bp => ({
        enabled: bp.enabled,
        condition: bp.condition,
        hitCondition: bp.hitCondition,
        logMessage: bp.logMessage,
      })),

      // Sessões de debug ativas
      activeDebugSessions: vscode.debug.activeDebugSession
        ? {
            id: vscode.debug.activeDebugSession.id,
            name: vscode.debug.activeDebugSession.name,
            type: vscode.debug.activeDebugSession.type,
            configuration: vscode.debug.activeDebugSession.configuration,
          }
        : null,
    };
  }

  /**
   * Obter informações de performance
   */
  async getPerformanceInfo() {
    return {
      // Configurações de performance
      performanceConfig: vscode.workspace.getConfiguration('workbench'),

      // Informações de memória (se disponível)
      memoryUsage: process.memoryUsage(),

      // Configurações de renderização
      renderConfig: vscode.workspace
        .getConfiguration('editor')
        .get('renderWhitespace'),

      // Configurações de minimap
      minimapConfig: vscode.workspace.getConfiguration('editor').get('minimap'),
    };
  }

  /**
   * Obter todas as informações técnicas disponíveis
   */
  async getAllTechnicalInfo() {
    return {
      workspace: await this.getWorkspaceInfo(),
      diagnostics: await this.getDiagnostics(),
      activeEditor: this.getActiveEditorInfo(),
      languages: await this.getLanguageInfo(),
      extensions: await this.getExtensionsInfo(),
      typescript: await this.getTypeScriptInfo(),
      linters: await this.getLinterInfo(),
      build: await this.getBuildInfo(),
      git: await this.getGitInfo(),
      debug: await this.getDebugInfo(),
      performance: await this.getPerformanceInfo(),

      // Informações do sistema
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        vscodeVersion: vscode.version,
      },
    };
  }

  private getSeverityName(severity: vscode.DiagnosticSeverity): string {
    switch (severity) {
      case vscode.DiagnosticSeverity.Error:
        return 'Error';
      case vscode.DiagnosticSeverity.Warning:
        return 'Warning';
      case vscode.DiagnosticSeverity.Information:
        return 'Information';
      case vscode.DiagnosticSeverity.Hint:
        return 'Hint';
      default:
        return 'Unknown';
    }
  }

  private async getLanguageExtensions() {
    const extensions = vscode.extensions.all;
    const languageExtensions = extensions.filter(
      ext =>
        ext.packageJSON.contributes?.languages ||
        ext.packageJSON.contributes?.grammars ||
        ext.packageJSON.contributes?.languages
    );

    return languageExtensions.map(ext => ({
      id: ext.id,
      displayName: ext.packageJSON.displayName,
      languages: ext.packageJSON.contributes?.languages || [],
      grammars: ext.packageJSON.contributes?.grammars || [],
    }));
  }
}
