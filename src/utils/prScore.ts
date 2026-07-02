import { analyzePrComment, type PrCommentCheckResult } from './prComments';

export interface PrScore {
  score: number; // 0..100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  passed: boolean;
  detail: PrCommentCheckResult;
}

const SECTION_WEIGHT = 15;
const MIN_WORDS = 20;
const PASS_THRESHOLD = 60;

/**
 * Compute a quality score for a PR description.
 */
export function scorePrComment(comment: string): PrScore {
  const detail = analyzePrComment(comment);

  let score = 0;
  if (detail.hasSummary) score += SECTION_WEIGHT;
  if (detail.hasTesting) score += SECTION_WEIGHT;
  if (detail.hasRisks) score += SECTION_WEIGHT;
  if (detail.hasIssue) score += SECTION_WEIGHT;
  if (detail.hasChecklist) score += SECTION_WEIGHT;

  // Reward longer, more detailed descriptions.
  const lengthBonus = (detail.wordCount / MIN_WORDS) * 25;
  score += lengthBonus;

  if (score > 100) {
    score = 100;
  }

  return {
    score,
    grade: toGrade(score),
    passed: score > PASS_THRESHOLD,
    detail,
  };
}

function toGrade(score: number): PrScore['grade'] {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score > 60) return 'D';
  return 'F';
}
