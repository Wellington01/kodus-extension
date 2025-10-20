import * as vscode from 'vscode';
import { getActiveEditor, showWarning } from '@utils';
import type { ExtensionContext, SnippetItem } from '@types';

export function registerSnippetProvider(context: ExtensionContext) {
  // Snippets úteis para desenvolvimento
  const snippets: { [key: string]: vscode.SnippetString } = {
    'console.log': new vscode.SnippetString('console.log($1);'),
    'function': new vscode.SnippetString('function ${1:name}($2) {\n\t$3\n}'),
    'arrow-function': new vscode.SnippetString('const ${1:name} = ($2) => {\n\t$3\n};'),
    'async-function': new vscode.SnippetString('async function ${1:name}($2) {\n\t$3\n}'),
    'try-catch': new vscode.SnippetString('try {\n\t$1\n} catch (error) {\n\t$2\n}'),
    'if-statement': new vscode.SnippetString('if ($1) {\n\t$2\n}'),
    'for-loop': new vscode.SnippetString('for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t$3\n}'),
    'foreach': new vscode.SnippetString('${1:array}.forEach((${2:item}) => {\n\t$3\n});'),
    'map': new vscode.SnippetString('${1:array}.map((${2:item}) => {\n\t$3\n});'),
    'filter': new vscode.SnippetString('${1:array}.filter((${2:item}) => {\n\t$3\n});'),
    'reduce': new vscode.SnippetString('${1:array}.reduce((${2:accumulator}, ${3:current}) => {\n\t$4\n}, ${5:initialValue});'),
    'class': new vscode.SnippetString('class ${1:ClassName} {\n\tconstructor($2) {\n\t\t$3\n\t}\n}'),
    'interface': new vscode.SnippetString('interface ${1:InterfaceName} {\n\t$2\n}'),
    'type': new vscode.SnippetString('type ${1:TypeName} = $2;'),
    'import': new vscode.SnippetString('import { $1 } from \'$2\';'),
    'export': new vscode.SnippetString('export { $1 };'),
    'default-export': new vscode.SnippetString('export default $1;'),
    'useEffect': new vscode.SnippetString('useEffect(() => {\n\t$1\n}, [$2]);'),
    'useState': new vscode.SnippetString('const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState($2);'),
    'component': new vscode.SnippetString('const ${1:ComponentName} = () => {\n\treturn (\n\t\t<div>\n\t\t\t$2\n\t\t</div>\n\t);\n};'),
    'html-boilerplate': new vscode.SnippetString('<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>$1</title>\n</head>\n<body>\n\t$2\n</body>\n</html>'),
    'css-reset': new vscode.SnippetString('* {\n\tmargin: 0;\n\tpadding: 0;\n\tbox-sizing: border-box;\n}'),
    'media-query': new vscode.SnippetString('@media (${1:max-width}: ${2:768px}) {\n\t$3\n}'),
    'flex-center': new vscode.SnippetString('display: flex;\njustify-content: center;\nalign-items: center;'),
    'grid-center': new vscode.SnippetString('display: grid;\nplace-items: center;'),
    'comment': new vscode.SnippetString('/* $1 */'),
    'todo': new vscode.SnippetString('// TODO: $1'),
    'fixme': new vscode.SnippetString('// FIXME: $1'),
    'note': new vscode.SnippetString('// NOTE: $1'),
    'timestamp': new vscode.SnippetString('// ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE} ${CURRENT_HOUR}:${CURRENT_MINUTE}:${CURRENT_SECOND}'),
  };

  // Comando para inserir snippets
  const insertSnippetCommand = vscode.commands.registerCommand(
    'kodus-extension.insertSnippet',
    async () => {
      const editor = getActiveEditor();
      if (!editor) {
        showWarning('No active editor found');
        return;
      }

      const snippetItems = Object.keys(snippets).map(key => ({
        label: key,
        description: `Insert ${key} snippet`,
        snippet: snippets[key]
      }));

      const selected = await vscode.window.showQuickPick(snippetItems, {
        placeHolder: 'Select a snippet to insert'
      });

      if (selected) {
        await editor.insertSnippet(selected.snippet);
      }
    }
  );

  context.subscriptions.push(insertSnippetCommand);
}
