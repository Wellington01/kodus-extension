export interface AIConfig {
  serverUrl: string;
  apiKey?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface AIMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface AnalysisRequest {
  type: AnalysisType;
  code: string;
  customPrompt?: string;
}

export type AnalysisType =
  | 'Code Review'
  | 'Bug Detection'
  | 'Performance Analysis'
  | 'Security Review'
  | 'Documentation'
  | 'Custom Analysis';

export interface AnalysisResult {
  type: AnalysisType;
  code: string;
  result: string;
  timestamp: number;
  prompt: string;
}

export interface AICommandContext {
  config: AIConfig;
  context?: Record<string, unknown>;
}
