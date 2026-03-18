import * as vscode from 'vscode';

// Extension types
export type ExtensionContext = vscode.ExtensionContext;

// Command types
export interface CommandHandler {
  (context: ExtensionContext): void;
}

export interface CommandRegistration {
  command: string;
  handler: CommandHandler;
  title: string;
  category?: string;
}

// Utility types
export interface CaseType {
  UPPERCASE: string;
  lowercase: string;
  camelCase: string;
  PascalCase: string;
  'kebab-case': string;
  snake_case: string;
}

export type CaseConverterType = keyof CaseType;

// Configuration types
export interface ExtensionConfiguration {
  formatOnSave: boolean;
  autoFormatJson: boolean;
  enableSnippets: boolean;
  debugMode: boolean;
}

// Event types
export interface ExtensionEvents {
  onActivate: () => void;
  onDeactivate: () => void;
  onCommand: (command: string) => void;
}

// Error types
export interface ExtensionError extends Error {
  code: string;
  context?: Record<string, unknown>;
}

// Provider types
export interface SnippetItem {
  label: string;
  description: string;
  snippet: vscode.SnippetString;
}

export interface QuickPickItem extends vscode.QuickPickItem {
  value: string;
  action: () => void;
}

// Re-export AI types
export * from './ai';
