import type { EvaluationResult } from './evaluationEngine';

export const CURRENT_EVALUATION_KEY = 'sagarmanthan:current-evaluation';
const SAVED_EVALUATIONS_KEY = 'sagarmanthan:saved-evaluations';

export function getCurrentEvaluation(): EvaluationResult | null {
  try {
    const raw = sessionStorage.getItem(CURRENT_EVALUATION_KEY);
    return raw ? JSON.parse(raw) as EvaluationResult : null;
  } catch { return null; }
}

export function getSavedEvaluations(): EvaluationResult[] {
  try {
    const raw = localStorage.getItem(SAVED_EVALUATIONS_KEY);
    return raw ? JSON.parse(raw) as EvaluationResult[] : [];
  } catch { return []; }
}

export function saveEvaluation(result: EvaluationResult): void {
  const existing = getSavedEvaluations().filter((item) => item.reference !== result.reference);
  localStorage.setItem(SAVED_EVALUATIONS_KEY, JSON.stringify([result, ...existing]));
}
