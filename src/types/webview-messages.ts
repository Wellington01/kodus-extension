/**
 * Webview message types
 * Defines all message interfaces for communication between webview and extension
 */

/**
 * Base interface for all webview messages
 */
export interface WebviewMessage {
  command: string;
}

/**
 * AI Chat Service messages
 */
export interface SendMessageCommand extends WebviewMessage {
  command: 'sendMessage';
  content: string;
}

export interface ConfigureAICommand extends WebviewMessage {
  command: 'configureAI';
}

export type AIChatMessage = SendMessageCommand | ConfigureAICommand;

/**
 * Main Webview Provider messages
 */
export interface FormatJsonCommand extends WebviewMessage {
  command: 'formatJson';
}

export interface ConvertCaseCommand extends WebviewMessage {
  command: 'convertCase';
}

export interface InsertTimestampCommand extends WebviewMessage {
  command: 'insertTimestamp';
}

export interface InsertSnippetCommand extends WebviewMessage {
  command: 'insertSnippet';
}

export interface InitializeAICommand extends WebviewMessage {
  command: 'initializeAI';
  config: {
    serverUrl: string;
    apiKey: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface SendAIMessageCommand extends WebviewMessage {
  command: 'sendAIMessage';
  content: string;
  context?: Record<string, unknown>;
}

export interface DisconnectAICommand extends WebviewMessage {
  command: 'disconnectAI';
}

export interface FetchGitHubPRsCommand extends WebviewMessage {
  command: 'fetchGitHubPRs';
}

export interface ResyncGitHubPRsCommand extends WebviewMessage {
  command: 'resyncGitHubPRs';
}

export interface CreateGitHubPRCommand extends WebviewMessage {
  command: 'createGitHubPR';
}

export interface AutoMergePRsCommand extends WebviewMessage {
  command: 'autoMergePRs';
}

export interface OpenGitHubPRCommand extends WebviewMessage {
  command: 'openGitHubPR';
  prNumber: number;
}

export interface GitHubPRMessage extends WebviewMessage {
  command: 'fetch-github-prs' | 'resync-github-prs';
  data?: {
    force?: boolean;
  };
}

/**
 * Union type for all main webview messages
 */
export type MainWebviewMessage =
  | FormatJsonCommand
  | ConvertCaseCommand
  | InsertTimestampCommand
  | InsertSnippetCommand
  | InitializeAICommand
  | SendAIMessageCommand
  | DisconnectAICommand
  | FetchGitHubPRsCommand
  | ResyncGitHubPRsCommand
  | CreateGitHubPRCommand
  | AutoMergePRsCommand
  | OpenGitHubPRCommand
  | GitHubPRMessage;
