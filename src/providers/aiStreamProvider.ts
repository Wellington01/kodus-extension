import * as vscode from 'vscode';
import type { ExtensionContext } from '@types';

export interface AIStreamMessage {
  type: 'text' | 'error' | 'done' | 'metadata';
  content: string;
  timestamp: number;
  id?: string;
}

export interface AIStreamConfig {
  serverUrl: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class AIStreamProvider {
  private eventSource?: EventSource;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 second
  private messageHandlers = new Set<(message: AIStreamMessage) => void>();
  private config: AIStreamConfig;

  constructor(
    private context: ExtensionContext,
    config: AIStreamConfig
  ) {
    this.config = {
      temperature: 0.7,
      maxTokens: 2048,
      ...config,
    };
  }

  /**
   * Inicia conexão com o servidor de AI
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const url = new URL('/api/ai/stream', this.config.serverUrl);

      // Adiciona parâmetros de configuração
      if (this.config.apiKey) {
        url.searchParams.set('apiKey', this.config.apiKey);
      }
      if (this.config.model) {
        url.searchParams.set('model', this.config.model);
      }
      if (this.config.temperature) {
        url.searchParams.set('temperature', this.config.temperature.toString());
      }
      if (this.config.maxTokens) {
        url.searchParams.set('maxTokens', this.config.maxTokens.toString());
      }

      this.eventSource = new EventSource(url.toString());

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        console.log('AI Stream connected');
        this.notifyHandlers({
          type: 'metadata',
          content: 'Connected to AI service',
          timestamp: Date.now(),
        });
      };

      this.eventSource.onmessage = event => {
        try {
          const data = JSON.parse(event.data) as AIStreamMessage;
          this.notifyHandlers(data);
        } catch (error) {
          console.error('Error parsing AI stream message:', error);
          this.notifyHandlers({
            type: 'error',
            content: 'Error parsing message from AI service',
            timestamp: Date.now(),
          });
        }
      };

      this.eventSource.onerror = error => {
        console.error('AI Stream error:', error);
        this.isConnected = false;

        this.notifyHandlers({
          type: 'error',
          content: 'Connection error with AI service',
          timestamp: Date.now(),
        });

        this.attemptReconnect();
      };

      // Cleanup na desativação da extensão
      this.context.subscriptions.push({
        dispose: () => this.disconnect(),
      });
    } catch (error: any) {
      console.error('Failed to connect to AI stream:', error);
      throw new Error(`Failed to connect to AI service: ${error.message}`, {
        cause: error,
      });
    }
  }

  /**
   * Envia mensagem para o agente de AI
   */
  async sendMessage(message: string, context?: any): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to AI service');
    }

    try {
      const response = await fetch(`${this.config.serverUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && {
            Authorization: `Bearer ${this.config.apiKey}`,
          }),
        },
        body: JSON.stringify({
          message,
          context,
          config: {
            model: this.config.model,
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      this.notifyHandlers({
        type: 'error',
        content: `Failed to send message: ${error}`,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Adiciona handler para mensagens do stream
   */
  onMessage(handler: (message: AIStreamMessage) => void): void {
    this.messageHandlers.add(handler);
  }

  /**
   * Remove handler de mensagens
   */
  offMessage(handler: (message: AIStreamMessage) => void): void {
    this.messageHandlers.delete(handler);
  }

  /**
   * Notifica todos os handlers sobre nova mensagem
   */
  private notifyHandlers(message: AIStreamMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  /**
   * Tenta reconectar em caso de erro
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.notifyHandlers({
        type: 'error',
        content: 'Max reconnection attempts reached',
        timestamp: Date.now(),
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    setTimeout(() => {
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      this.disconnect();
      this.connect();
    }, delay);
  }

  /**
   * Desconecta do stream
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Verifica se está conectado
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<AIStreamConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Provider para gerenciar múltiplas conexões AI
 */
export class AIManager {
  private providers = new Map<string, AIStreamProvider>();

  constructor(private context: ExtensionContext) {}

  /**
   * Cria nova conexão AI
   */
  createProvider(id: string, config: AIStreamConfig): AIStreamProvider {
    if (this.providers.has(id)) {
      throw new Error(`AI provider with id '${id}' already exists`);
    }

    const provider = new AIStreamProvider(this.context, config);
    this.providers.set(id, provider);

    // Cleanup automático
    this.context.subscriptions.push({
      dispose: () => {
        provider.disconnect();
        this.providers.delete(id);
      },
    });

    return provider;
  }

  /**
   * Obtém provider por ID
   */
  getProvider(id: string): AIStreamProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Remove provider
   */
  removeProvider(id: string): void {
    const provider = this.providers.get(id);
    if (provider) {
      provider.disconnect();
      this.providers.delete(id);
    }
  }

  /**
   * Lista todos os providers
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Desconecta todos os providers
   */
  disconnectAll(): void {
    this.providers.forEach(provider => provider.disconnect());
    this.providers.clear();
  }
}
