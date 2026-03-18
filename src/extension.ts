import * as vscode from 'vscode';
import { registerQuickActions } from '@commands/quickActions';
import { registerSnippetProvider } from '@providers/snippetProvider';
import { KodusWebviewProvider } from '@webview/webviewProvider';
import type { ExtensionContext } from '@types';

export function activate(context: ExtensionContext) {
  console.log('Kodus Development Tools is now active!');

  // Registrar comandos de ações rápidas
  registerQuickActions(context);

  // Registrar provider de snippets
  registerSnippetProvider(context);

  // Registrar webview provider
  const webviewProvider = new KodusWebviewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      KodusWebviewProvider.viewType,
      webviewProvider
    )
  );

  // Comando de boas-vindas
  const welcomeCommand = vscode.commands.registerCommand(
    'kodus-extension.welcome',
    () => {
      vscode.window
        .showInformationMessage(
          '🚀 Kodus Development Tools activated! Use Ctrl+Shift+P to access all features.',
          'Open Commands'
        )
        .then(selection => {
          if (selection === 'Open Commands') {
            vscode.commands.executeCommand('workbench.action.showCommands');
          }
        });
    }
  );

  context.subscriptions.push(welcomeCommand);

  // Mostrar mensagem de boas-vindas na primeira ativação
  const isFirstActivation = context.globalState.get(
    'kodus-extension.firstActivation',
    true
  );
  if (isFirstActivation) {
    vscode.window
      .showInformationMessage(
        '🎉 Welcome to Kodus Development Tools! This extension provides open-source development utilities.',
        'Show Commands',
        'Dismiss'
      )
      .then(selection => {
        if (selection === 'Show Commands') {
          vscode.commands.executeCommand('workbench.action.showCommands');
        }
      });
    context.globalState.update('kodus-extension.firstActivation', false);
  }
}

export function deactivate() {
  console.log('Kodus Development Tools is now deactivated');
}
