import { describe, expect, it } from 'vitest';
import { calculatePerfectRoundBonus, pointsForGoldenGoal, pointsForMoM, pointsForPrediction } from '@/lib/scoring';

describe('group scoring', () => {
  it('scores correct win and draw', () => {
    const win = pointsForPrediction('GROUP', 'HOME_WIN', {
      status: 'FINISHED',
      homeFtGoals: 2,
      awayFtGoals: 0,
      homeEtGoals: null,
      awayEtGoals: null,
      wentToPens: false,
      pensWinnerTeamId: null,
      homeTeamId: 'h',
      awayTeamId: 'a'
    });
    const draw = pointsForPrediction('GROUP', 'DRAW', {
      status: 'FINISHED',
      homeFtGoals: 1,
      awayFtGoals: 1,
      homeEtGoals: null,
      awayEtGoals: null,
      wentToPens: false,
      pensWinnerTeamId: null,
      homeTeamId: 'h',
      awayTeamId: 'a'
    });
    expect(win).toBe(1);
    expect(draw).toBe(2);
  });
});

describe('perfect round bonus', () => {
  it('awards +2 when all picks are correct', () => {
    expect(calculatePerfectRoundBonus([1, 2, 1], 'GROUP')).toBe(2);
    expect(calculatePerfectRoundBonus([1, 0, 1], 'GROUP')).toBe(0);
  });
});

describe('knockout markets', () => {
  it('scores FT, ET, DRAW_ET and PENS outcomes', () => {
    expect(
      pointsForPrediction('R16', 'HOME_FT', {
        status: 'FINISHED',
        homeFtGoals: 1,
        awayFtGoals: 0,
        homeEtGoals: null,
        awayEtGoals: null,
        wentToPens: false,
        pensWinnerTeamId: null,
        homeTeamId: 'h',
        awayTeamId: 'a'
      })
    ).toBe(1);

    expect(
      pointsForPrediction('QF', 'AWAY_ET', {
        status: 'FINISHED',
        homeFtGoals: 0,
        awayFtGoals: 0,
        homeEtGoals: 0,
        awayEtGoals: 1,
        wentToPens: false,
        pensWinnerTeamId: null,
        homeTeamId: 'h',
        awayTeamId: 'a'
      })
    ).toBe(3);

    expect(
      pointsForPrediction('SF', 'DRAW_ET', {
        status: 'FINISHED',
        homeFtGoals: 1,
        awayFtGoals: 1,
        homeEtGoals: 2,
        awayEtGoals: 2,
        wentToPens: false,
        pensWinnerTeamId: null,
        homeTeamId: 'h',
        awayTeamId: 'a'
      })
    ).toBe(4);

    expect(
      pointsForPrediction('FINAL', 'HOME_PENS', {
        status: 'FINISHED',
        homeFtGoals: 1,
        awayFtGoals: 1,
        homeEtGoals: 1,
        awayEtGoals: 1,
        wentToPens: true,
        pensWinnerTeamId: 'h',
        homeTeamId: 'h',
        awayTeamId: 'a'
      })
    ).toBe(7);
  });
});

describe('golden goal', () => {
  it('scores exact/within5/no-goal', () => {
    expect(pointsForGoldenGoal(45, false, 46, false).points).toBe(3);
    expect(pointsForGoldenGoal(50, false, 54, false).points).toBe(1);
    expect(pointsForGoldenGoal(null, true, null, true).points).toBe(3);
  });
});

describe('mom scoring', () => {
  it('matches trim/case-insensitive', () => {
    expect(pointsForMoM('  Mbappe ', 'mbappe')).toBe(2);
    expect(pointsForMoM('Messi', 'Neymar')).toBe(0);
  });
});
