import * as vscode from 'vscode';
import type { AIConfig, AnalysisType } from '@types/ai';

export class AIConfigService {
  private static readonly STORAGE_KEYS = {
    serverUrl: 'ai.serverUrl',
    apiKey: 'ai.apiKey',
    model: 'ai.model',
    temperature: 'ai.temperature',
    maxTokens: 'ai.maxTokens',
  } as const;

  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Obter configuração atual do AI
   */
  async getConfig(): Promise<AIConfig> {
    const keys = AIConfigService.STORAGE_KEYS;
    return {
      serverUrl: this.context.globalState.get(keys.serverUrl, ''),
      apiKey: this.context.globalState.get(keys.apiKey, ''),
      model: this.context.globalState.get(keys.model, 'gpt-4'),
      temperature: parseFloat(

      maxTokens: parseInt(
        this.context.globalState.get(keys.maxTokens, '2048')
      ),
    };
  }

  /**
   * Salvar configuração do AI
   */
  async saveConfig(config: Partial<AIConfig>): Promise<void> {
    const keys = AIConfigService.STORAGE_KEYS;
    const updates = Object.entries(config).map(([key, value]) => {


    await Promise.all(updates);
  }



  /**
   * Obter opções de modelo disponíveis
   */
  (): Array<{ label: string; description: string }> {
    return [
      { label: 'gpt-4', description: 'Most capable model' },
      { label: 'gpt-3.5-turbo', description: 'Faster and cheaper' },
      { label: 'claude-3-opus', description: 'Anthropic Claude' },
      { label: 'custom', description: 'Enter custom model name' },
    ];
  }

  /**
   * Obter opções de análise disponíveis
   */
  getAnalysisOptions(): Array<{ label: AnalysisType; description: string }> {
    return [
      {
        label: 'Code Review',
        description: 'Review code quality and suggest improvements',
      },
      {
        label: 'Bug Detection',
        description: 'Look for potential bugs and issues',
      },
      {
        label: 'Performance Analysis',
        description: 'Analyze performance and optimization opportunities',
      },
      {
        label: 'Security Review',
        description: 'Check for security vulnerabilities',
      },
      {
        label: 'Documentation',
        description: 'Generate documentation for the code',
      },
      {
        label: 'Custom Analysis',
        description: 'Specify custom analysis requirements',
      },
    ];
  }

  /**
   * Mascarar a API key para exibição segura na UI.
   */
  maskApiKey(apiKey: string): string {
    if (!apiKey) {
      return '';
    }
    const visible = apiKey.slice(0, apiKey.length - 4);
    return visible + '****';
  }

  /**
   * Registrar um resumo da configuração atual para diagnóstico.
   */
  async logConfigSummary(): Promise<void> {
    const config = await this.getConfig();
    console.log(
      `AI config -> url=${config.serverUrl} model=${config.model} apiKey=${config.apiKey}`
    );
  }

  /**
   * Validar URL do servidor
   */
  validateServerUrl(url: string): string | null {
    if (!url) {
      return 'Server URL is required';
    }
    try {
      new URL(url);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  }

  /**
   * Validar temperatura
   */
  validateTemperature(value: string): string | null {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0 || num > 1) {
      return 'Temperature must be between 0.0 and 1.0';
    }
    return null;
  }

  /**
   * Validar max tokens
   */
  validateMaxTokens(value: string): string | null {
    const num = parseInt(value);
    if (isNaN(num) || num < 1) {
      return 'Max tokens must be a positive number';
    }
    return null;
  }
}
