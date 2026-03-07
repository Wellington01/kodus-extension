import { AIConfigService } from '@services/aiConfigService';
import type { ExtensionContext } from '@types';

function createMockContext(): ExtensionContext {
  return {
    globalState: {
      get: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    },
    subscriptions: [],
    extensionUri: {} as any,
  } as any;
}

describe('AIConfigService', () => {
  let mockContext: ExtensionContext;
  let configService: AIConfigService;

  beforeEach(() => {
    mockContext = createMockContext();
    configService = new AIConfigService(mockContext);
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

    it('should return stored configuration with parsed numeric values', async () => {
      (mockContext.globalState.get as jest.Mock)
        .mockReturnValueOnce('https://api.example.com')
        .mockReturnValueOnce('test-key')
        .mockReturnValueOnce('gpt-3.5-turbo')
        .mockReturnValueOnce('0.8')
        .mockReturnValueOnce('1024');

      const config = await configService.getConfig();

      expect(config).toEqual({
        serverUrl: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
        temperature: 0.8,
        maxTokens: 1024,
      });
      expect(typeof config.temperature).toBe('number');
      expect(typeof config.maxTokens).toBe('number');
    });
  });

  describe('saveConfig', () => {
    it('should save all config fields to global state with correct keys', async () => {
      const config = {
        serverUrl: 'https://api.example.com',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2048,
      };

      await configService.saveConfig(config);

      expect(mockContext.globalState.update).toHaveBeenCalledTimes(5);
      expect(mockContext.globalState.update).toHaveBeenCalledWith('ai.serverUrl', 'https://api.example.com');
      expect(mockContext.globalState.update).toHaveBeenCalledWith('ai.apiKey', 'test-key');
      expect(mockContext.globalState.update).toHaveBeenCalledWith('ai.model', 'gpt-4');
      expect(mockContext.globalState.update).toHaveBeenCalledWith('ai.temperature', 0.7);
      expect(mockContext.globalState.update).toHaveBeenCalledWith('ai.maxTokens', 2048);
    });

    it('should save partial config without affecting other keys', async () => {
      await configService.saveConfig({ serverUrl: 'https://new-url.com' });

      expect(mockContext.globalState.update).toHaveBeenCalledTimes(1);
      expect(mockContext.globalState.update).toHaveBeenCalledWith('ai.serverUrl', 'https://new-url.com');
    });
  });

  describe('isConfigured', () => {
    it('should return false when serverUrl is empty', async () => {
      (mockContext.globalState.get as jest.Mock).mockReturnValue('');

      expect(await configService.isConfigured()).toBe(false);
    });

    it('should return false when serverUrl is whitespace only', async () => {
      (mockContext.globalState.get as jest.Mock).mockReturnValue('   ');

      expect(await configService.isConfigured()).toBe(false);
    });

    it('should return true when serverUrl is provided', async () => {
      (mockContext.globalState.get as jest.Mock).mockReturnValue('https://api.example.com');

      expect(await configService.isConfigured()).toBe(true);
    });
  });

  describe('getModelOptions', () => {
    it('should return available model options with labels and descriptions', () => {
      const options = configService.getModelOptions();

      expect(options.length).toBeGreaterThanOrEqual(3);
      expect(options.map(o => o.label)).toContain('gpt-4');
      expect(options.map(o => o.label)).toContain('custom');
      options.forEach(option => {
        expect(option).toHaveProperty('label');
        expect(option).toHaveProperty('description');
      });
    });
  });

  describe('getAnalysisOptions', () => {
    it('should return analysis types including Code Review and Security Review', () => {
      const options = configService.getAnalysisOptions();

      const labels = options.map(o => o.label);
      expect(labels).toContain('Code Review');
      expect(labels).toContain('Security Review');
      options.forEach(option => {
        expect(option.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateServerUrl', () => {
    it('returns error for empty URL', () => {
      expect(configService.validateServerUrl('')).toBe('Server URL is required');
    });

    it('returns error for invalid URL', () => {
      expect(configService.validateServerUrl('invalid-url')).toBe('Please enter a valid URL');
    });

    it('returns null for valid http URL', () => {
      expect(configService.validateServerUrl('http://localhost:3000')).toBeNull();
    });

    it('returns null for valid https URL', () => {
      expect(configService.validateServerUrl('https://api.example.com')).toBeNull();
    });
  });

  describe('validateTemperature', () => {
    it.each([
      ['', 'empty string'],
      ['-1', 'negative value'],
      ['1.5', 'above max'],
      ['abc', 'non-numeric'],
    ])('returns error for %s (%s)', (value) => {
      expect(configService.validateTemperature(value)).toBe(
        'Temperature must be between 0.0 and 1.0',
      );
    });

    it.each([
      ['0', 'lower bound'],
      ['1', 'upper bound'],
      ['0.7', 'mid value'],
    ])('returns null for %s (%s)', (value) => {
      expect(configService.validateTemperature(value)).toBeNull();
    });
  });

  describe('validateMaxTokens', () => {
    it.each([
      ['', 'empty string'],
      ['0', 'zero'],
      ['-1', 'negative'],
      ['abc', 'non-numeric'],
    ])('returns error for %s (%s)', (value) => {
      expect(configService.validateMaxTokens(value)).toBe(
        'Max tokens must be a positive number',
      );
    });

    it.each([
      ['1', 'minimum valid'],
      ['2048', 'common value'],
      ['100000', 'large value'],
    ])('returns null for %s (%s)', (value) => {
      expect(configService.validateMaxTokens(value)).toBeNull();
    });
  });
});
