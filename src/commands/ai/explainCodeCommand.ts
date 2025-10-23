import * as vscode from 'vscode';
import type { ExtensionContext } from '@types';
import { AIConfigService } from '@services/aiConfigService';
import { AIAnalysisService } from '@services/aiAnalysisService';

/**
 * Comando para explicar código selecionado
 * Demonstra como adicionar novos comandos facilmente
 */
export class ExplainCodeCommand {
  constructor(
    private context: ExtensionContext,
    private configService: AIConfigService,
    private analysisService: AIAnalysisService
  ) {}

  async execute(): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
      }

      const selectedText = editor.selection.isEmpty
        ? editor.document.getText()
        : editor.document.getText(editor.selection);

      if (!selectedText.trim()) {
        vscode.window.showWarningMessage('Please select code to explain');
        return;
      }

      await this.explainCode(selectedText);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to explain code: ${error}`);
    }
  }

  private async explainCode(code: string): Promise<void> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Explaining code with AI...',
        cancellable: true,
      },
      async (progress, token) => {
        try {
          // Usar o serviço de análise com prompt customizado
          const result = await this.analysisService.simulateAnalysis(
            'Custom Analysis',
            code,
            'Please explain this code in detail, including:\n1. What the code does\n2. How it works\n3. Key concepts used\n4. Potential improvements\n\nMake the explanation clear and educational.'
          );

          await this.displayExplanation(result);
        } catch (error) {
          vscode.window.showErrorMessage(`Explanation failed: ${error}`);
        }
      }
    );
  }

  private async displayExplanation(result: any): Promise<void> {
    const doc = await vscode.workspace.openTextDocument({
      content: `# Code Explanation\n\n${result.result}`,
      language: 'markdown',
    });
    await vscode.window.showTextDocument(doc);
  }
}
