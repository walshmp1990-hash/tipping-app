import { StageType, PredictionOutcome } from '@prisma/client';

export type CsvFixtureRow = {
  CompetitionID: string;
  Date: string;
  Stage: string;
  'Game Week': string;
  Home_TeamID: string;
  Away_TeamID: string;
  'Fixture Number': string;
  StadiumID?: string;
  Result?: string;
  Creator?: string;
  'unique id'?: string;
};

export type ParsedFixtureInput = {
  competitionId: string;
  fixtureNumber: number;
  kickoffAtUtc: Date;
  stageType: StageType;
  groupLabel: string | null;
  roundName: string;
  roundNumber: number | null;
  sortOrder: number;
  homeTeamName: string;
  awayTeamName: string;
  stadiumId: string | null;
  creator: string | null;
  uniqueImportId: string | null;
};

export type LockContext = {
  lockAtUtc: Date;
  nowUtc: Date;
};

export type KnockoutOutcome = Extract<
  PredictionOutcome,
  'HOME_FT' | 'HOME_ET' | 'HOME_PENS' | 'AWAY_FT' | 'AWAY_ET' | 'AWAY_PENS' | 'DRAW_FT' | 'DRAW_ET'
>;
