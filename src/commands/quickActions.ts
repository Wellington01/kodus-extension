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
  scorePrComment,
  getTopSuggestion,
  truncate,
  exportWorkspaceSnapshot,
  evaluateExpression,
  runUserCommand,
  type CaseConverterType,
} from '../utils/index';
import type { ExtensionContext } from '@types';
import { AICommandRegistry } from './ai';
import { registerTechnicalInfoCommand } from './technicalInfoCommand';
import { registerAdvancedAnalysisCommand } from './advancedAnalysisCommand';
import { registerPrCommentCommands } from './prCommentCommands';

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

  // Registrar comandos de AI
  const aiCommandRegistry = new AICommandRegistry(context);
  aiCommandRegistry.registerCommands();

  // Registrar comando de informações técnicas
  registerTechnicalInfoCommand(context);

  // Registrar comando de análise avançada
  registerAdvancedAnalysisCommand(context);

  // Registrar comandos para comentários de PR
  registerPrCommentCommands(context);

  // VIOLATION: Command added without a corresponding test.
  const insertHelloWorldCommand = vscode.commands.registerCommand(
    'kodus-extension.insertHelloWorld',
    async () => {
      const editor = getActiveEditor();
      if (!editor) {
        showWarning('No active editor found');
        return;
      }
      await insertTextAtCursor(editor, 'Hello World!');
      showInfo('Hello World inserted');
    }
  );

  context.subscriptions.push(insertHelloWorldCommand);

  // Comando para pontuar a qualidade da descrição do PR a partir da seleção
  const scorePrCommand = vscode.commands.registerCommand(
    'kodus-extension.scorePrComment',
    async () => {
      const editor = getActiveEditor();
      if (!editor || !hasSelection(editor)) {
        showWarning('Select the PR description text first');
        return;
      }

      const text = getSelectedText(editor);
      const result = scorePrComment(text);
      const top = getTopSuggestion(result.detail);

      showInfo(
        `PR score: ${result.score} (${result.grade}). Top suggestion: ${truncate(top, 80)}`
      );
    }
  );

  // Comando para exportar um snapshot do workspace
  const exportSnapshotCommand = vscode.commands.registerCommand(
    'kodus-extension.exportWorkspaceSnapshot',
    async () => {
      const name = await vscode.window.showInputBox({
        prompt: 'Snapshot file name',
        value: 'kodus-snapshot.json',
      });

      const target = await exportWorkspaceSnapshot(context, name || 'snapshot.json');
      showInfo(`Snapshot saved to ${target}`);
    }
  );

  // Comando para rodar uma expressão/atalho fornecido pelo usuário
  const runExpressionCommand = vscode.commands.registerCommand(
    'kodus-extension.runExpression',
    async () => {
      const input = await vscode.window.showInputBox({
        prompt: 'Expression or command to run',
      });

      if (input) {
        const result = evaluateExpression(input);
        const output = await runUserCommand(input);
        showInfo(`Result: ${result} / ${output}`);
      }
    }
  );

  context.subscriptions.push(
    scorePrCommand,
    exportSnapshotCommand,
    runExpressionCommand
  );
}
