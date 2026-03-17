import { analyzePrComment, buildPrCommentTemplate } from '@utils/prComments';

describe('analyzePrComment', () => {
  it('detects specific missing sections on short comments', () => {
    const result = analyzePrComment('Pequeno texto sem estrutura clara.');

    expect(result.missingSections).toEqual(
      expect.arrayContaining([
        'summary/context',
        'tests/QA evidence',
        'risks/impact',
        'issue/PR reference',
        'checklist',
      ]),
    );
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.wordCount).toBeLessThan(20);
    expect(result.bulletCount).toBe(0);
  });

  it('handles empty input gracefully', () => {
    const result = analyzePrComment('');

    expect(result.wordCount).toBe(0);
    expect(result.bulletCount).toBe(0);
    expect(result.missingSections).toHaveLength(5);
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
    expect(result.suggestions).toEqual([]);
    expect(result.hasSummary).toBe(true);
    expect(result.hasTesting).toBe(true);
    expect(result.hasRisks).toBe(true);
    expect(result.hasIssue).toBe(true);
    expect(result.hasChecklist).toBe(true);
    expect(result.bulletCount).toBeGreaterThan(0);
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
    expect(template).toContain('- npm test');
    expect(template).toContain('## Risks');
    expect(template).toContain('- Baixo risco');
    expect(template).toContain('Related: #45');
    expect(template).toContain('Branch: feat/pr-comments');
    expect(template).toContain('## Checklist');
  });

  it('uses default values when optional fields are omitted', () => {
    const template = buildPrCommentTemplate({ summary: 'Minimal PR' });

    expect(template).toContain('Minimal PR');
    expect(template).toContain('Descreva as principais mudanças realizadas.');
    expect(template).toContain('## Checklist');
    expect(template).not.toContain('Related:');
    expect(template).not.toContain('Branch:');
    expect(template).not.toContain('## Notes');
  });

  it('excludes checklist when includeChecklist is false', () => {
    const template = buildPrCommentTemplate({
      summary: 'No checklist',
      includeChecklist: false,
    });

    expect(template).not.toContain('## Checklist');
  });

  it('includes notes section when provided', () => {
    const template = buildPrCommentTemplate({
      summary: 'With notes',
      notes: 'Deploy after QA approval',
    });

    expect(template).toContain('## Notes');
    expect(template).toContain('Deploy after QA approval');
  });
});
