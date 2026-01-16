import { analyzePrComment, buildPrCommentTemplate } from '@utils/prComments';

describe('analyzePrComment', () => {
  it('detects missing structure on short comments', () => {
    const result = analyzePrComment('Pequeno texto sem estrutura clara.');

    expect(result.missingSections.length).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('passes when all expected sections are present', () => {
    const comment = `
## Summary
- Atualiza o fluxo de geração e validação de comentários de PR para cobrir checklist e referências.

## Changes
- Ajusta validação
- Adiciona geração automática

## Testing
- npm test

## Risks
- Baixo risco, mudança isolada

Related: #123
- [ ] QA/manual check done
    `;

    const result = analyzePrComment(comment);

    expect(result.missingSections).toEqual([]);
  });
});

describe('buildPrCommentTemplate', () => {
  it('builds a template with the provided details', () => {
    const template = buildPrCommentTemplate({
      summary: 'Add helpers for PR comments',
      testing: '- npm test',
      risks: '- Baixo risco',
      relatedIssue: '#45',
      branchName: 'feat/pr-comments',
      changes: ['Modified src/commands/prCommentCommands.ts'],
    });

    expect(template).toContain('## Summary');
    expect(template).toContain('Add helpers for PR comments');
    expect(template).toContain('## Changes');
    expect(template).toContain('Modified src/commands/prCommentCommands.ts');
    expect(template).toContain('## Testing');
    expect(template).toContain('#45');
    expect(template).toContain('feat/pr-comments');
  });
});
