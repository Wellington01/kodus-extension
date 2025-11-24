import * as vscode from 'vscode';
import type { ExtensionContext } from '@types';
import { AdvancedAnalysisService } from '@utils/advancedAnalysis';

export class AdvancedAnalysisCommand {
  constructor(private context: ExtensionContext) {}

  async execute(): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
      }

      const analysisService = new AdvancedAnalysisService(this.context);

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '🔍 Advanced Code Analysis...',
          cancellable: true,
        },
        async (progress, token) => {
          progress.report({ increment: 20, message: 'Analyzing AST...' });

          const allInfo = await analysisService.getAllAdvancedInfo();

          progress.report({ increment: 30, message: 'Processing diff...' });

          progress.report({ increment: 30, message: 'Accessing LSP...' });

          progress.report({ increment: 20, message: 'Finalizing...' });

          await this.displayAdvancedAnalysis(allInfo);
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Advanced analysis failed: ${error}`);
    }
  }

  private async displayAdvancedAnalysis(info: any): Promise<void> {
    // Criar um documento com todas as informações avançadas
    const content = this.formatAdvancedAnalysis(info);

    const doc = await vscode.workspace.openTextDocument({
      content,
      language: 'json',
    });

    await vscode.window.showTextDocument(doc);

    // Mostrar resumo em notificação
    this.showAdvancedSummary(info);
  }

  private formatAdvancedAnalysis(info: any): string {
    return JSON.stringify(info, null, 2);
  }

  private showAdvancedSummary(info: any): void {
    const astInfo = info.ast || {};
    const diffInfo = info.diff || {};
    const lspInfo = info.lsp || {};

    const summary = `
🔍 ANÁLISE AVANÇADA DE CÓDIGO:

🌳 AST (Abstract Syntax Tree):
• Tipo: ${astInfo.manualAST?.type || 'N/A'}
• Funções: ${astInfo.manualAST?.functions?.length || 0}
• Classes: ${astInfo.manualAST?.classes?.length || 0}
• Imports: ${astInfo.manualAST?.imports?.length || 0}
• Complexidade: ${astInfo.manualAST?.complexity || 'N/A'}

📊 DIFF (Diferenças):
• Git disponível: ${diffInfo.gitDiff?.available ? '✅' : '❌'}
• Mudanças no working tree: ${diffInfo.gitDiff?.workingTreeChanges?.length || 0}
• Mudanças staged: ${diffInfo.gitDiff?.stagedChanges?.length || 0}
• Histórico disponível: ${diffInfo.changeHistory?.available ? '✅' : '❌'}

🔧 LSP (Language Server Protocol):
• Language Server ativo: ${lspInfo.languageServer?.activeLanguageServers?.length || 0}
• Diagnósticos: ${lspInfo.languageServer?.diagnostics?.length || 0}
• Completions: ${lspInfo.completions?.available ? '✅' : '❌'}
• Hover info: ${lspInfo.hoverInfo?.available ? '✅' : '❌'}
• Code actions: ${lspInfo.codeActions?.available ? '✅' : '❌'}

📈 ESTATÍSTICAS:
• Linhas de código: ${astInfo.document?.lineCount || 0}
• Versão do documento: ${astInfo.document?.version || 0}
• Linguagem: ${astInfo.document?.languageId || 'N/A'}
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

export function registerAdvancedAnalysisCommand(
  context: ExtensionContext
): void {
  const command = new AdvancedAnalysisCommand(context);

  const disposable = vscode.commands.registerCommand(
    'kodus-extension.advancedAnalysis',
    () => command.execute()
  );

  context.subscriptions.push(disposable);
}
