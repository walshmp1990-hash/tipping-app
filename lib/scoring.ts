import { FixtureStatus, PredictionOutcome, StageType } from '@prisma/client';

export type ResultShape = {
  status: FixtureStatus;
  homeFtGoals: number | null;
  awayFtGoals: number | null;
  homeEtGoals: number | null;
  awayEtGoals: number | null;
  wentToPens: boolean;
  pensWinnerTeamId: string | null;
  homeTeamId: string;
  awayTeamId: string;
  officialManOfMatch?: string | null;
  openingGoalMinuteActual?: number | null;
};

export function pointsForPrediction(stageType: StageType, prediction: PredictionOutcome, result: ResultShape): number {
  if (result.status !== 'FINISHED' || result.homeFtGoals === null || result.awayFtGoals === null) return 0;

  if (stageType === 'GROUP') {
    const actual = result.homeFtGoals > result.awayFtGoals ? 'HOME_WIN' : result.homeFtGoals < result.awayFtGoals ? 'AWAY_WIN' : 'DRAW';
    if (actual === 'DRAW') return prediction === 'DRAW' ? 2 : 0;
    return prediction === actual ? 1 : 0;
  }

  const ftOutcome = result.homeFtGoals > result.awayFtGoals ? 'HOME' : result.homeFtGoals < result.awayFtGoals ? 'AWAY' : 'DRAW';
  if (ftOutcome === 'HOME' && prediction === 'HOME_FT') return 1;
  if (ftOutcome === 'AWAY' && prediction === 'AWAY_FT') return 1;
  if (ftOutcome === 'DRAW' && prediction === 'DRAW_FT') return 2;

  if (result.homeEtGoals !== null && result.awayEtGoals !== null) {
    const etOutcome = result.homeEtGoals > result.awayEtGoals ? 'HOME' : result.homeEtGoals < result.awayEtGoals ? 'AWAY' : 'DRAW';
    if (!result.wentToPens) {
      if (etOutcome === 'HOME' && prediction === 'HOME_ET') return 3;
      if (etOutcome === 'AWAY' && prediction === 'AWAY_ET') return 3;
      if (etOutcome === 'DRAW' && prediction === 'DRAW_ET') return 4;
      return 0;
    }
  }

  if (result.wentToPens && result.pensWinnerTeamId) {
    if (result.pensWinnerTeamId === result.homeTeamId && prediction === 'HOME_PENS') return 7;
    if (result.pensWinnerTeamId === result.awayTeamId && prediction === 'AWAY_PENS') return 7;
  }

  return 0;
}

export function clampGoalMinute(minute: number): number {
  if (minute <= 45) return minute;
  if (minute <= 48) return 45;
  if (minute <= 90) return minute;
  if (minute <= 93) return 90;
  if (minute <= 105) return minute;
  if (minute <= 108) return 105;
  if (minute <= 120) return minute;
  return 120;
}

export function pointsForGoldenGoal(predictedMinute: number | null, noGoal: boolean, actualMinute: number | null, endedNoGoal: boolean): { points: number; exact: boolean } {
  if (noGoal) {
    return { points: endedNoGoal ? 3 : 0, exact: endedNoGoal };
  }
  if (!predictedMinute || !actualMinute) return { points: 0, exact: false };
  const predicted = clampGoalMinute(predictedMinute);
  const actual = clampGoalMinute(actualMinute);
  if (predicted === actual) return { points: 3, exact: true };
  if (Math.abs(predicted - actual) <= 5) return { points: 1, exact: false };
  return { points: 0, exact: false };
}

export function pointsForMoM(prediction: string | null | undefined, official: string | null | undefined): number {
  if (!prediction || !official) return 0;
  return prediction.trim().toLowerCase() === official.trim().toLowerCase() ? 2 : 0;
}

export function shouldIncludeExtras(stageType: StageType): boolean {
  return ['QF', 'SF', 'THIRD', 'FINAL'].includes(stageType);
}

export function calculatePerfectRoundBonus(points: number[], stageType: StageType): number {
  if (stageType !== 'GROUP') return 0;
  if (points.length === 0) return 0;
  return points.every((p) => p > 0) ? 2 : 0;
}
