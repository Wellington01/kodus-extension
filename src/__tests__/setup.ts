// Setup file for Jest tests
import 'jest';

// Mock VSCode API
jest.mock('vscode', () => ({
  window: {
    showInputBox: jest.fn(),
    showQuickPick: jest.fn(),
    showInformationMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    withProgress: jest.fn(),
    createWebviewPanel: jest.fn(),
    activeTextEditor: null,
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn(),
  },
  workspace: {
    openTextDocument: jest.fn(),
    applyEdit: jest.fn(),
  },
  env: {
    clipboard: {
      writeText: jest.fn(),
    },
  },
  ExtensionContext: jest.fn(),
  ViewColumn: {
    One: 1,
  },
  ProgressLocation: {
    Notification: 1,
  },
  WorkspaceEdit: jest.fn(),
  Range: jest.fn(),
  SnippetString: jest.fn(),
}), { virtual: true });

declare global {
  // eslint-disable-next-line no-var
  var createMockExtensionContext: () => unknown;
}

// Global test utilities
globalThis.createMockExtensionContext = () => ({
  globalState: {
    get: jest.fn(),
    update: jest.fn(),
  },
  subscriptions: [],
  extensionUri: {} as unknown,
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
