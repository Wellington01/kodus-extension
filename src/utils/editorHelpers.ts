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
