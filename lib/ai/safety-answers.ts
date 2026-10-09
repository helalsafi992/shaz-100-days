import type { Intake } from './intake';

type Safety = Intake['safety'];
type ScreenKey = Exclude<keyof Safety, 'injury'>;
type AnswerState = { safety: Safety; answered: string[] };
export const exerciseScreenKeys = ['urgentSymptoms', 'exertionalSymptoms', 'medicalExerciseRestriction'] as const;
export const foodScreenKeys = ['pregnancyOrPostpartum', 'medicalDietNeeded', 'calorieTrackingConcern', 'severeFoodAllergy'] as const;

/** Only an explicit grouped denial supplies No answers. Reopening the group
 * invalidates those denials; otherwise old defaults can look like new answers. */
export function selectSafetyGroup<T extends AnswerState>(state: T, keys: readonly ScreenKey[], selection: 'none' | 'details'): T {
  if (selection === 'details') {
    return {
      ...state,
      answered: state.answered.filter(key =>
        !keys.some(k => k === key && state.safety[k] === 'no')),
    };
  }
  return {
    ...state,
    safety: { ...state.safety, ...Object.fromEntries(keys.map(key => [key, 'no'])) },
    answered: [...new Set([...state.answered, ...keys])],
  };
}

/** A new injury status needs newly confirmed details, not answers left over
 * from a different injury status. Existing positive data changes only on choice. */
export function selectInjuryStatus<T extends AnswerState>(state: T, status: Safety['injury']['status']): T {
  if (state.safety.injury.status === status && state.answered.includes('injury.status')) return state;
  return {
    ...state,
    safety: {
      ...state.safety,
      injury: {
        status, areas: [], side: 'not-applicable', pain: 0, duration: 'none',
        worsening: 'no', dailyLimitation: 'no', professionalAssessment: 'none',
        triggers: [], afterReaction: 'none', restrictions: [],
      },
    },
    answered: [...state.answered.filter(key => !key.startsWith('injury.')), 'injury.status'],
  };
}
