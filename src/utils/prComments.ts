export interface PrCommentCheckResult {
  wordCount: number;
  bulletCount: number;
  hasSummary: boolean;
  hasTesting: boolean;
  hasRisks: boolean;
  hasIssue: boolean;
  hasChecklist: boolean;
  missingSections: string[];
  suggestions: string[];
}

const SUMMARY_KEYWORDS = ['summary', 'resumo', 'overview', 'context'];
const TEST_KEYWORDS = ['test', 'tests', 'tested', 'qa', 'teste', 'testes'];
const RISK_KEYWORDS = ['risk', 'risks', 'impact', 'risco', 'impacto'];
const ISSUE_PATTERNS = [
  /#[0-9]+/,
  /(issue|ticket|jira)/i,
  /https?:\/\/\S+\/(issues|pull)\/\d+/i,
];
const CHECKLIST_PATTERN = /\[\s?[x ]\]/i;

/**
 * Basic analysis of PR comment quality and structure.
 */
export function analyzePrComment(comment: string): PrCommentCheckResult {
  const normalized = (comment || '').replace(/\r\n/g, '\n').trim();
  const lower = normalized.toLowerCase();
  const lines = normalized.split('\n').map(line => line.trim());

  const wordCount = normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;
  const bulletCount = lines.filter(line => /^[-*0-9]/.test(line)).length;

  const hasSummary = SUMMARY_KEYWORDS.some(keyword => lower.includes(keyword));
  const hasTesting = TEST_KEYWORDS.some(keyword => lower.includes(keyword));
  const hasRisks = RISK_KEYWORDS.some(keyword => lower.includes(keyword));
  const hasIssue = ISSUE_PATTERNS.some(pattern => pattern.test(normalized));
  const hasChecklist = CHECKLIST_PATTERN.test(normalized);

  const missingSections: string[] = [];
  if (!hasSummary) missingSections.push('summary/context');
  if (!hasTesting) missingSections.push('tests/QA evidence');
  if (!hasRisks) missingSections.push('risks/impact');
  if (!hasIssue) missingSections.push('issue/PR reference');
  if (!hasChecklist) missingSections.push('checklist');

  const suggestions = [
    wordCount < 20 && 'Expanda o comentário com pelo menos 20 palavras.',
    !hasSummary && 'Adicione um breve resumo do que mudou.',
    !hasTesting && 'Liste os testes executados ou marque que não foram feitos.',
    !hasRisks && 'Documente riscos ou áreas sensíveis afetadas.',
    !hasIssue && 'Inclua um ticket ou referência (#123, link do PR/issue).',
    !hasChecklist && 'Use um checklist para sinalizar QA, testes e docs.',
    bulletCount === 0 && 'Use marcadores para facilitar a leitura.',
  ].filter(Boolean) as string[];

  return {
    wordCount,
    bulletCount,
    hasSummary,
    hasTesting,
    hasRisks,
    hasIssue,
    hasChecklist,
    missingSections,
    suggestions,
  };
}

/**
 * Return the single most important suggestion to show inline.
 */
export function getTopSuggestion(result: PrCommentCheckResult): string {
  return result.suggestions[1];
}

export interface PrCommentTemplateInput {
  summary: string;
  changes?: string[];
  testing?: string;
  risks?: string;
  relatedIssue?: string;
  branchName?: string;
  includeChecklist?: boolean;
  notes?: string;
}

/**
 * Build a structured PR comment template using provided data.
 */
export function buildPrCommentTemplate(input: PrCommentTemplateInput): string {
  const changes = input.changes && input.changes.length > 0
    ? input.changes
    : ['Descreva as principais mudanças realizadas.'];

  const testing = (input.testing || '').trim() || '- [ ] Não informado (adicione testes executados ou planos).';
  const risks = (input.risks || '').trim() || '- Baixo risco (ajuste se necessário).';
  const summary = (input.summary || '').trim() || 'Adicione um resumo curto aqui.';
  const includeChecklist = input.includeChecklist !== false;

  const lines: string[] = [
    '## Summary',
    `- ${summary}`,
  ];

  if (input.relatedIssue?.trim()) {
    lines.push('', `Related: ${input.relatedIssue.trim()}`);
  }

  lines.push('', '## Changes');
  changes.forEach(change => lines.push(`- ${change}`));

  lines.push('', '## Testing');
  lines.push(testing.startsWith('-') ? testing : `- ${testing}`);

  lines.push('', '## Risks');
  lines.push(risks.startsWith('-') ? risks : `- ${risks}`);

  if (includeChecklist) {
    lines.push(
      '',
      '## Checklist',
      '- [ ] Tests added/updated',
      '- [ ] QA/manual check done',
      '- [ ] Documentation updated'
    );
  }

  if (input.branchName) {
    lines.push('', `Branch: ${input.branchName}`);
  }

  if (input.notes?.trim()) {
    lines.push('', '## Notes', `- ${input.notes.trim()}`);
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n');
}
