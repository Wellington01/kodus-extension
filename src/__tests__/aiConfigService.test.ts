import { AIConfigService } from '@services/aiConfigService';
import type { ExtensionContext } from '@types';

// Mock do ExtensionContext
const mockContext: ExtensionContext = {
  globalState: {
    get: jest.fn(),
    update: jest.fn(),
  },
  subscriptions: [],
  extensionUri: {} as any,
} as any;

describe('AIConfigService', () => {
  let configService: AIConfigService;

  beforeEach(() => {
    configService = new AIConfigService(mockContext);
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return default configuration when no stored config exists', async () => {
      (mockContext.globalState.get as jest.Mock).mockReturnValue('');

      const config = await configService.getConfig();

      expect(config).toEqual({
        serverUrl: '',
        apiKey: '',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2048,
      });
    });

    it('should return stored configuration', async () => {
      const storedConfig = {
        serverUrl: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
        temperature: '0.8',
        maxTokens: '1024',
      };

      (mockContext.globalState.get as jest.Mock)
        .mockReturnValueOnce(storedConfig.serverUrl)
        .mockReturnValueOnce(storedConfig.apiKey)
        .mockReturnValueOnce(storedConfig.model)
        .mockReturnValueOnce(storedConfig.temperature)
        .mockReturnValueOnce(storedConfig.maxTokens);

      const config = await configService.getConfig();

      expect(config).toEqual({
        serverUrl: storedConfig.serverUrl,
        apiKey: storedConfig.apiKey,
        model: storedConfig.model,
        temperature: 0.8,
        maxTokens: 1024,
      });
    });
  });

  describe('saveConfig', () => {
    it('should save configuration to global state', async () => {
      const config = {
        serverUrl: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2048,
      };

      await configService.saveConfig(config);

      expect(mockContext.globalState.update).toHaveBeenCalledTimes(5);
      expect(mockContext.globalState.update).toHaveBeenCalledWith(
        'ai.serverUrl',
        config.serverUrl
      );
      expect(mockContext.globalState.update).toHaveBeenCalledWith(
        'ai.apiKey',
        config.apiKey
      );
    });
  });

  describe('isConfigured', () => {
    it('should return false when serverUrl is empty', async () => {
      (mockContext.globalState.get as jest.Mock).mockReturnValue('');

      const isConfigured = await configService.isConfigured();

      expect(isConfigured).toBe(false);
    });

    it('should return true when serverUrl is provided', async () => {
      (mockContext.globalState.get as jest.Mock).mockReturnValue(
        'https://api.example.com'
      );

      const isConfigured = await configService.isConfigured();

      expect(isConfigured).toBe(true);
    });
  });

  describe('validation methods', () => {
    it('should validate server URL correctly', () => {
      expect(configService.validateServerUrl('')).toBe(
        'Server URL is required'
      );
      expect(configService.validateServerUrl('invalid-url')).toBe(
        'Please enter a valid URL'
      );
      expect(configService.validateServerUrl('https://api.example.com')).toBe(
        null
      );
    });

    it('should validate temperature correctly', () => {
      expect(configService.validateTemperature('')).toBe(
        'Temperature must be between 0.0 and 1.0'
      );
      expect(configService.validateTemperature('-1')).toBe(
        'Temperature must be between 0.0 and 1.0'
      );
      expect(configService.validateTemperature('1.5')).toBe(
        'Temperature must be between 0.0 and 1.0'
      );
      expect(configService.validateTemperature('0.7')).toBe(null);
    });

    it('should validate max tokens correctly', () => {
      expect(configService.validateMaxTokens('')).toBe(
        'Max tokens must be a positive number'
      );
      expect(configService.validateMaxTokens('0')).toBe(
        'Max tokens must be a positive number'
      );
      expect(configService.validateMaxTokens('-1')).toBe(
        'Max tokens must be a positive number'
      );
      expect(configService.validateMaxTokens('2048')).toBe(null);
    });
  });
});
