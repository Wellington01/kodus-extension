import * as vscode from 'vscode';
import type { ExtensionContext } from '@types';
import { AIConfigService } from '@services/aiConfigService.js';
import { AIAnalysisService } from '@services/aiAnalysisService';
import { ConfigureAICommand } from './configureAICommand';
import { StartAIChatCommand } from './startAIChatCommand';
import { AnalyzeCodeCommand } from './analyzeCodeCommand';

export class AICommandRegistry {
  private configService: AIConfigService;
  private analysisService: AIAnalysisService;

  constructor(private context: ExtensionContext) {
    this.configService = new AIConfigService(context);
    this.analysisService = new AIAnalysisService();
  }

  registerCommands(): void {
    // Configure AI Command
    const configureCommand = new ConfigureAICommand(
      this.context,
      this.configService
    );
    const configureAICommand = vscode.commands.registerCommand(
      'kodus-extension.configureAI',
      () => configureCommand.execute()
    );

    // Start AI Chat Command
    const startChatCommand = new StartAIChatCommand(
      this.context,
      this.configService
    );
    const startAIChatCommand = vscode.commands.registerCommand(
      'kodus-extension.startAIChat',
      () => startChatCommand.execute()
    );

    // Analyze Code Command
    const analyzeCommand = new AnalyzeCodeCommand(
      this.context,
      this.configService,
      this.analysisService
    );
    const analyzeCodeCommand = vscode.commands.registerCommand(
      'kodus-extension.analyzeCode',
      () => analyzeCommand.execute()
    );

    // Explain Code Command
    const explainCommand = new ExplainCodeCommand(
      this.context,
      this.configService,
      this.analysisService
    );
    const explainCodeCommand = vscode.commands.registerCommand(
      'kodus-extension.explainCode',
      () => explainCommand.execute()
    );

    // Register all commands
    this.context.subscriptions.push(
      configureAICommand,
      startAIChatCommand,
      analyzeCodeCommand,
      explainCodeCommand
    );
  }

  // Getters for services (useful for testing)
  getConfigService(): AIConfigService {
    return this.configService;
  }

  getAnalysisService(): AIAnalysisService {
    return this.analysisService;
  }
}
