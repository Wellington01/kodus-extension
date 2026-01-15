import * as path from 'path';
import * as vscode from 'vscode';
import type { ExtensionContext } from '@types';
import { analyzePrComment, buildPrCommentTemplate } from '@utils/prComments';
import {
  getActiveEditor,
  getSelectedText,
  hasSelection,
  insertTextAtCursor,
  showInfo,
  showWarning,
} from '@utils/editorHelpers';

export function registerPrCommentCommands(context: ExtensionContext) {
  const validateCommand = vscode.commands.registerCommand(
    'kodus-extension.validatePrComment',
    async () => {
      const editor = getActiveEditor();
      let comment =
        editor && hasSelection(editor) ? getSelectedText(editor).trim() : '';

      if (!comment) {
        comment =
          (await vscode.window.showInputBox({
            prompt: 'Cole o comentário de PR que deseja validar',
            placeHolder: '## Summary\n- ...',
            ignoreFocusOut: true,
          }))?.trim() ?? '';
      }

      if (!comment) {
        showWarning('Nenhum comentário de PR informado para validação.');
        return;
      }

      const result = analyzePrComment(comment);
      const details = [
        'Validação de comentário de PR:',
        `• Palavras: ${result.wordCount}`,
        `• Marcadores: ${result.bulletCount}`,
        result.missingSections.length
          ? `• Seções faltando: ${result.missingSections.join(', ')}`
          : '• Estrutura básica encontrada',
        '',
        'Sugestões:',
        ...(result.suggestions.length
          ? result.suggestions.map(suggestion => `- ${suggestion}`)
          : ['- Nenhuma sugestão adicional.']),
      ].join('\n');

      const action = await vscode.window.showInformationMessage(
        result.missingSections.length
          ? 'O comentário precisa de ajustes.'
          : 'O comentário parece completo.',
        'Copiar detalhes'
      );

      if (action === 'Copiar detalhes') {
        await vscode.env.clipboard.writeText(details);
        showInfo('Detalhes da validação copiados.');
      }
    }
  );

  const generateCommand = vscode.commands.registerCommand(
    'kodus-extension.generatePrComment',
    async () => {
      const gitContext = await collectGitContext();
      const summary = (
        await vscode.window.showInputBox({
          prompt: 'Resumo breve das mudanças para o PR',
          placeHolder: 'Ex: Implementa validação e geração de comentários de PR',
          ignoreFocusOut: true,
        })
      )?.trim();

      if (!summary) {
        showWarning('Informe um resumo para gerar o comentário de PR.');
        return;
      }

      const testing =
        (await vscode.window.showInputBox({
          prompt: 'Testes executados (opcional)',
          placeHolder: '- npm test\n- QA manual',
          ignoreFocusOut: true,
        })) ?? '';

      const risks =
        (await vscode.window.showInputBox({
          prompt: 'Riscos/impacto (opcional)',
          placeHolder: 'Ex: afeta fluxo de revisão, exige reindexação',
          ignoreFocusOut: true,
        })) ?? '';

      const relatedIssue =
        (await vscode.window.showInputBox({
          prompt: 'Issue ou link relacionado (opcional)',
          placeHolder: '#123, JIRA-123, https://...',
          ignoreFocusOut: true,
        })) ?? '';

      const template = buildPrCommentTemplate({
        summary,
        testing,
        risks,
        relatedIssue,
        branchName: gitContext.branchName,
        changes: gitContext.changes,
      });

      const editor = getActiveEditor();
      if (editor) {
        const choice = await vscode.window.showQuickPick(
          ['Inserir no editor', 'Copiar para área de transferência'],
          { placeHolder: 'Como você quer usar o comentário gerado?' }
        );

        if (choice === 'Inserir no editor') {
          await insertTextAtCursor(editor, template);
          showInfo('Comentário de PR gerado e inserido.');
          return;
        }
      }

      await vscode.env.clipboard.writeText(template);
      showInfo('Comentário de PR gerado e copiado.');
    }
  );

  context.subscriptions.push(validateCommand, generateCommand);
}

async function collectGitContext(): Promise<{ branchName?: string; changes: string[] }> {
  const changes: string[] = [];
  let branchName: string | undefined;

  try {
    const gitExtension = vscode.extensions.getExtension('vscode.git');
    if (!gitExtension) {
      return { branchName, changes };
    }

    const git = gitExtension.isActive
      ? gitExtension.exports
      : await gitExtension.activate();

    const api = typeof git.getAPI === 'function' ? git.getAPI(1) : git;
    const repo = api?.repositories?.[0];
    if (!repo) {
      return { branchName, changes };
    }

    branchName = repo.state?.HEAD?.name || repo.state?.HEAD?.commit;
    const rootPath = repo.rootUri?.fsPath;
    const changeGroups = [
      ...(repo.state?.indexChanges ?? []),
      ...(repo.state?.workingTreeChanges ?? []),
      ...(repo.state?.mergeChanges ?? []),
    ];

    changeGroups.forEach((change: any) => {
      const label = formatChange(change, rootPath);
      if (label) {
        changes.push(label);
      }
    });
  } catch (error) {
    console.error('Failed to collect Git context for PR comment', error);
  }

  return { branchName, changes: Array.from(new Set(changes)) };
}

function formatChange(change: any, rootPath?: string): string {
  const uri = change?.resourceUri ?? change?.uri;
  const filePath =
    uri?.fsPath || uri?.path || (typeof uri === 'string' ? uri : '');

  const relative = rootPath && filePath
    ? path.relative(rootPath, filePath) || path.basename(filePath)
    : filePath || 'arquivo';

  const statusLabel = getStatusLabel(
    change?.status ?? change?.type ?? change?.resourceGroupType
  );

  return statusLabel ? `${statusLabel}: ${relative}` : relative;
}

function getStatusLabel(status: any): string {
  if (typeof status === 'string') {
    return status;
  }

  const statusMap: Record<number, string> = {
    0: 'Staged modification',
    1: 'Staged addition',
    2: 'Staged deletion',
    3: 'Renamed',
    4: 'Copied',
    5: 'Modified',
    6: 'Deleted',
    7: 'Untracked',
    8: 'Ignored',
    9: 'Intent to add',
    10: 'Added by us',
    11: 'Added by them',
    12: 'Deleted by us',
    13: 'Deleted by them',
    14: 'Both added',
    15: 'Both deleted',
    16: 'Conflicted',
  };

  return statusMap[status] || 'Updated';
}
