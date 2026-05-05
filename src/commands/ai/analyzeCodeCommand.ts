import * as vscode from 'vscode';
import type { ExtensionContext, AnalysisType } from '@types';
import { AIConfigService } from '@services/aiConfigService';
import { AIAnalysisService } from '@services/aiAnalysisService';

export class AnalyzeCodeCommand {
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

      const analysisRequest = await this.collectAnalysisRequest();
      if (!analysisRequest) return;

      await this.performAnalysis(analysisRequest, selectedText);
    } catch (error) {
      vscode.window.showErrorMessage(`Analysis failed: ${error}`);
    }
  }

  private async collectAnalysisRequest(): Promise<{
    type: AnalysisType;
    customPrompt?: string;
  } | null> {
    const analysisType = await vscode.window.showQuickPick(
      this.configService.getAnalysisOptions(),
      {
        placeHolder: 'Select analysis type',
      }
    );

    if (!analysisType) return null;

    let customPrompt: string | undefined;
    if (analysisType.label === 'Custom Analysis') {
      customPrompt = await vscode.window.showInputBox({
        prompt: 'Enter custom analysis prompt',
        placeHolder: 'e.g., Explain this code and suggest improvements',
      });
      if (!customPrompt) return null;
    }

    return {
      type: analysisType.label,
      customPrompt,
    };
  }

  private async performAnalysis(
    request: { type: AnalysisType; customPrompt?: string },
    code: string
  ): Promise<void> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing code with AI...',
        cancellable: true,
      },
      async (progress, token) => {
        try {
          const result = await this.analysisService.simulateAnalysis(
            request.type,
            code,
            request.customPrompt
          );

          await this.displayResult(result);
        } catch (error) {
          vscode.window.showErrorMessage(`Analysis failed: ${error}`);
        }
      }
    );
  }

  private async displayResult(result: any): Promise<void> {
    const doc = await vscode.workspace.openTextDocument({
      content: result.result,
      language: 'markdown',
    });
    await vscode.window.showTextDocument(doc);
  }
}
