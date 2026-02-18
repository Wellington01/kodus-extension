import * as vscode from 'vscode';
import type { ExtensionContext, TechnicalInfo } from '@types';
import { WorkspaceInfoService } from '@utils/workspaceInfo';

export class TechnicalInfoCommand {
  constructor(private context: ExtensionContext) {}

  async execute(): Promise<void> {
    try {
      const workspaceInfo = new WorkspaceInfoService(this.context);

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Coletando informações técnicas...',
          cancellable: true,
        },
        async (progress, token) => {
          progress.report({
            increment: 10,
            message: 'Analisando workspace...',
          });

          const allInfo = await workspaceInfo.getAllTechnicalInfo();

          progress.report({
            increment: 30,
            message: 'Processando diagnósticos...',
          });

          progress.report({
            increment: 30,
            message: 'Coletando informações de extensões...',
          });

          progress.report({ increment: 30, message: 'Finalizando...' });

          await this.displayTechnicalInfo(allInfo);
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Erro ao coletar informações técnicas: ${error}`
      );
    }
  }

  private async displayTechnicalInfo(info: TechnicalInfo): Promise<void> {
    // Criar um documento com todas as informações técnicas
    const content = this.formatTechnicalInfo(info);

    const doc = await vscode.workspace.openTextDocument({
      content,
      language: 'json',
    });

    await vscode.window.showTextDocument(doc);

    // Mostrar resumo em notificação
    this.showSummary(info);
  }

  private formatTechnicalInfo(info: TechnicalInfo): string {
    return JSON.stringify(info, null, 2);
  }

  private showSummary(info: TechnicalInfo): void {
    const workspaceInfo = info.workspace as { workspaceFolders?: unknown[]; openDocuments: unknown[] };
    const summary = `
📊 RESUMO TÉCNICO DO WORKSPACE:

🔧 Workspace:
• ${workspaceInfo.workspaceFolders?.length ?? 0} pasta(s) aberta(s)
• ${workspaceInfo.openDocuments.length} arquivo(s) aberto(s)

🐛 Diagnósticos:
• ${info.diagnostics.reduce((total, file) => total + file.diagnostics.length, 0)} problema(s) encontrado(s)
• ${info.diagnostics.length} arquivo(s) com problemas

🌐 Linguagens:
• ${info.languages.installedLanguages.length} linguagem(s) instalada(s)
• ${info.languages.languageExtensions.length} extensão(ões) de linguagem

🔌 Extensões:
• ${info.extensions.totalExtensions} extensão(ões) instalada(s)
• ${info.extensions.enabledExtensions.length} ativa(s)

⚙️ Configurações:
• TypeScript: ${info.typescript ? 'Configurado' : 'Não configurado'}
• ESLint: ${info.linters.eslint.isEnabled ? 'Ativo' : 'Inativo'}
• Prettier: ${info.linters.prettier.isEnabled ? 'Ativo' : 'Inativo'}

📁 Git:
• ${info.git ? info.git.repositories.length : 0} repositório(s) Git

🐛 Debug:
• ${info.debug.breakpoints.length} breakpoint(s) configurado(s)
• ${info.debug.activeDebugSessions ? 'Sessão ativa' : 'Nenhuma sessão ativa'}
    `;

    vscode.window
      .showInformationMessage(summary, 'Ver Detalhes', 'Fechar')
      .then(selection => {
        if (selection === 'Ver Detalhes') {
          vscode.commands.executeCommand('workbench.action.showCommands');
        }
      });
  }
}

export function registerTechnicalInfoCommand(context: ExtensionContext): void {
  const command = new TechnicalInfoCommand(context);

  const disposable = vscode.commands.registerCommand(
    'kodus-extension.technicalInfo',
    () => command.execute()
  );

  context.subscriptions.push(disposable);
}
