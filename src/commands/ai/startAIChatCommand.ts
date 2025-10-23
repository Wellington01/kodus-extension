import * as vscode from 'vscode';
import type { ExtensionContext } from '@types';
import { AIConfigService } from '@services/aiConfigService';
import { AIChatService } from '@services/aiChatService';

export class StartAIChatCommand {
  constructor(
    private context: ExtensionContext,
    private configService: AIConfigService
  ) {}

  async execute(): Promise<void> {
    try {
      const config = await this.configService.getConfig();

      if (!(await this.configService.isConfigured())) {
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

      const chatService = new AIChatService(config);
      chatService.createChatPanel(this.context);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to start AI chat: ${error}`);
    }
  }
}
