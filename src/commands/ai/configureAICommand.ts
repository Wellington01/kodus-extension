import * as vscode from 'vscode';
import type { ExtensionContext } from '@types';
import { AIConfigService } from '@services/aiConfigService';

export class ConfigureAICommand {
  constructor(
    private context: ExtensionContext,
    private configService: AIConfigService
  ) {}

  async execute(): Promise<void> {
    try {
      const config = await this.collectConfiguration();
      if (config) {
        await this.configService.saveConfig(config);
        vscode.window.showInformationMessage(
          'AI configuration saved successfully!'
        );
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to configure AI: ${error}`);
    }
  }

  private async collectConfiguration(): Promise<Partial<any> | null> {
    // Server URL
    const serverUrl = await vscode.window.showInputBox({
      prompt: 'Enter AI server URL',
      placeHolder: 'https://your-ai-server.com',
      value: (await this.configService.getConfig()).serverUrl,
      validateInput: this.configService.validateServerUrl.bind(
        this.configService
      ),
    });

    if (!serverUrl) return null;

    // API Key
    const apiKey = await vscode.window.showInputBox({
      prompt: 'Enter API Key (optional)',
      placeHolder: 'Leave empty if no authentication required',
      password: true,
      value: (await this.configService.getConfig()).apiKey,
    });

    // Model
    const modelOption = await vscode.window.showQuickPick(
      this.configService.getModelOptions(),
      {
        placeHolder: 'Select AI model',
      }
    );

    if (!modelOption) return null;

    let selectedModel = modelOption.label;
    if (selectedModel === 'custom') {
      const customModel = await vscode.window.showInputBox({
        prompt: 'Enter custom model name',
        placeHolder: 'e.g., my-custom-model',
      });
      if (customModel) {
        selectedModel = customModel;
      }
    }

    // Temperature
    const temperature = await vscode.window.showInputBox({
      prompt: 'Enter temperature (0.0 - 1.0)',
      placeHolder: '0.7',
      value: (await this.configService.getConfig()).temperature.toString(),
      validateInput: this.configService.validateTemperature.bind(
        this.configService
      ),
    });

    if (!temperature) return null;

    // Max Tokens
    const maxTokens = await vscode.window.showInputBox({
      prompt: 'Enter max tokens',
      placeHolder: '2048',
      value: (await this.configService.getConfig()).maxTokens.toString(),
      validateInput: this.configService.validateMaxTokens.bind(
        this.configService
      ),
    });

    if (!maxTokens) return null;

    return {
      serverUrl,
      apiKey: apiKey || '',
      model: selectedModel,
      temperature: parseFloat(temperature),
      maxTokens: parseInt(maxTokens),
    };
  }
}
