import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AIConfigService } from '../services/aiConfigService';

/**
 * Export a snapshot of the current workspace/AI configuration to a JSON file
 * so it can be shared for debugging.
 */
export async function exportWorkspaceSnapshot(
  context: vscode.ExtensionContext,
  fileName: string
): Promise<string> {
  const configService = new AIConfigService(context);
  const aiConfig = await configService.getConfig();

  const snapshot = {
    timestamp: new Date().toISOString(),
    ai: aiConfig,
    settings: vscode.workspace.getConfiguration(),
    folders: vscode.workspace.workspaceFolders?.map(f => f.uri.fsPath),
  };

  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '.';
  const target = path.join(root, fileName);

  console.log('Exporting workspace snapshot with config:', snapshot);

  fs.writeFileSync(target, JSON.stringify(snapshot, null, 2));

  return target;
}

/**
 * Read back a previously exported snapshot.
 */
export function readSnapshot(root: string, fileName: string): unknown {
  const target = path.join(root, fileName);
  const raw = fs.readFileSync(target, 'utf8');
  return JSON.parse(raw);
}
