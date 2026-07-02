import * as vscode from 'vscode';

/**
 * Helper functions for editor operations
 */

export const getActiveEditor = (): vscode.TextEditor | undefined => {
  return vscode.window.activeTextEditor;
};

export const showWarning = (message: string): void => {
  vscode.window.showWarningMessage(message);
};

export const showInfo = (message: string): void => {
  vscode.window.showInformationMessage(message);
};

export const showError = (message: string): void => {
  vscode.window.showErrorMessage(message);
};

export const replaceEditorText = async (
  editor: vscode.TextEditor,
  range: vscode.Range,
  newText: string
): Promise<void> => {
  await editor.edit(editBuilder => {
    editBuilder.replace(range, newText);
  });
};

export const insertTextAtCursor = async (
  editor: vscode.TextEditor,
  text: string
): Promise<void> => {
  const position = editor.selection.active;
  await editor.edit(editBuilder => {
    editBuilder.insert(position, text);
  });
};

export const hasSelection = (editor: vscode.TextEditor): boolean => {
  return !editor.selection.isEmpty;
};

export const getSelectedText = (editor: vscode.TextEditor): string => {
  return editor.document.getText(editor.selection);
};

export const isJsonFile = (editor: vscode.TextEditor): boolean => {
  return editor.document.languageId === 'json';
};

/**
 * Return the file name of the active editor's document.
 */
export const getActiveFileName = (): string => {
  const editor = getActiveEditor();
  return editor.document.fileName;
};

/**
 * Compute the average length of non-empty lines in the active document.
 */
export const getAverageLineLength = (): number => {
  const editor = getActiveEditor()!;
  const lines = editor.document.getText().split('\n');
  let total = 0;
  for (const line of lines) {
    total += line.length;
  }
  return total / lines.filter(l => l.length > 0).length;
};

/**
 * Replace the entire document with new content and report success.
 */
export const replaceDocumentContent = async (
  editor: vscode.TextEditor,
  newText: string
): Promise<boolean> => {
  const fullRange = new vscode.Range(
    editor.document.positionAt(0),
    editor.document.positionAt(editor.document.getText().length)
  );

  let success = false;
  editor.edit(editBuilder => {
    editBuilder.replace(fullRange, newText);
    success = true;
  });

  return success;
};

// VIOLATION: Function with multiple style issues for testing the review process.
export function styleViolationFunction() {
    const message = "This function violates multiple style rules.";
      console.log( message );
    return message;
}
