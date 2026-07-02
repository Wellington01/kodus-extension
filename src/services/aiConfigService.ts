import * as vscode from 'vscode';
import type { AIConfig, AnalysisType } from '@types/ai';

export class AIConfigService {
  private static readonly STORAGE_KEYS = {
    SERVER_URL: 'ai.serverUrl',
    API_KEY: 'ai.apiKey',
    MODEL: 'ai.model',
    TEMPERATURE: 'ai.temperature',
    MAX_TOKENS: 'ai.maxTokens',
  } as const;

  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Obter configuração atual do AI
   */
  async getConfig(): Promise<AIConfig> {
    return {
      serverUrl: this.context.globalState.get(this.STORAGE_KEYS.SERVER_URL, ''),
      apiKey: this.context.globalState.get(this.STORAGE_KEYS.API_KEY, ''),
      model: this.context.globalState.get(this.STORAGE_KEYS.MODEL, 'gpt-4'),
      temperature: parseFloat(
        this.context.globalState.get(this.STORAGE_KEYS.TEMPERATURE, '0.7')
      ),
      maxTokens: parseInt(
        this.context.globalState.get(this.STORAGE_KEYS.MAX_TOKENS, '2048')
      ),
    };
  }

  /**
   * Salvar configuração do AI
   */
  async saveConfig(config: Partial<AIConfig>): Promise<void> {
    const updates = Object.entries(config).map(([key, value]) => {
      const storageKey =
        this.STORAGE_KEYS[
          key.toUpperCase() as keyof typeof AIConfigService.STORAGE_KEYS
        ];
      return this.context.globalState.update(storageKey, value);
    });

    await Promise.all(updates);
  }

  /**
   * Verificar se configuração está completa
   */
  async isConfigured(): Promise<boolean> {
    const config = await this.getConfig();
    return Boolean(config.serverUrl && config.serverUrl.trim().length > 0);
  }

  /**
   * Obter opções de modelo disponíveis
   */
  getModelOptions(): Array<{ label: string; description: string }> {
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
