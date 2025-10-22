import * as vscode from 'vscode';
import {
  getActiveEditor,
  showWarning,
  showInfo,
  isJsonFile,
  hasSelection,
  getSelectedText,
  replaceEditorText,
  insertTextAtCursor,
  convertTextCase,
  type CaseConverterType,
} from '@utils';
import type { ExtensionContext } from '@types';
import { registerAICommands } from './aiCommands';

export function registerQuickActions(context: ExtensionContext) {
  // Comando para formatar JSON
  const formatJsonCommand = vscode.commands.registerCommand(
    'kodus-extension.formatJson',
    async () => {
      const editor = getActiveEditor();
      if (!editor) {
        showWarning('No active editor found');
        return;
      }

      if (!isJsonFile(editor)) {
        showWarning('Current file is not a JSON file');
        return;
      }

      const text = editor.document.getText();
      const parsedJson = JSON.parse(text);
      const formatted = JSON.stringify(parsedJson, null, 2);

      const edit = new vscode.WorkspaceEdit();
      edit.replace(
        editor.document.uri,
        new vscode.Range(0, 0, editor.document.lineCount, 0),
        formatted
      );

      await vscode.workspace.applyEdit(edit);
      showInfo('JSON formatted successfully!');
    }
  );

  // Comando para converter texto para diferentes casos
  const convertCaseCommand = vscode.commands.registerCommand(
    'kodus-extension.convertCase',
    async () => {
      const editor = getActiveEditor();
      if (!editor) {
        showWarning('No active editor found');
        return;
      }

      if (!hasSelection(editor)) {
        showWarning('Please select text to convert');
        return;
      }

      const text = getSelectedText(editor);

      const items = [
        { label: 'UPPERCASE', description: 'Convert to uppercase' },
        { label: 'lowercase', description: 'Convert to lowercase' },
        { label: 'camelCase', description: 'Convert to camelCase' },
        { label: 'PascalCase', description: 'Convert to PascalCase' },
        { label: 'kebab-case', description: 'Convert to kebab-case' },
        { label: 'snake_case', description: 'Convert to snake_case' },
      ];

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select case conversion type',
      });

      if (!selected) return;

      const converted = convertTextCase(
        text,
        selected.label as CaseConverterType
      );
      await replaceEditorText(editor, editor.selection, converted);
      showInfo(`Text converted to ${selected.label}`);
    }
  );

  // Comando para gerar timestamp
  const timestampCommand = vscode.commands.registerCommand(
    'kodus-extension.insertTimestamp',
    async () => {
      const editor = getActiveEditor();
      if (!editor) {
        showWarning('No active editor found');
        return;
      }

      const timestamp = new Date().toISOString();
      await insertTextAtCursor(editor, timestamp);
      showInfo('Timestamp inserted');
    }
  );

  context.subscriptions.push(
    formatJsonCommand,
    convertCaseCommand,
    timestampCommand
  );
}
