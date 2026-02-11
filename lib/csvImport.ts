import { parse } from 'csv-parse/sync';
import { fromZonedTime } from 'date-fns-tz';
import { StageType } from '@prisma/client';
import { CsvFixtureRow, ParsedFixtureInput } from './types';

const REQUIRED_HEADERS = ['CompetitionID', 'Date', 'Stage', 'Game Week', 'Home_TeamID', 'Away_TeamID', 'Fixture Number'] as const;

export function parseCsvRows(csvRaw: string): CsvFixtureRow[] {
  const records = parse(csvRaw, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as CsvFixtureRow[];

  if (records.length === 0) return [];
  const headers = Object.keys(records[0]);
  for (const req of REQUIRED_HEADERS) {
    if (!headers.includes(req)) throw new Error(`Missing required header: ${req}`);
  }
  return records;
}

export function mapStage(stageRaw: string, gameWeekRaw: string): Pick<ParsedFixtureInput, 'stageType' | 'groupLabel' | 'roundName' | 'roundNumber' | 'sortOrder'> {
  const stage = stageRaw.trim();
  const groupMatch = /^Group\s+([A-Z])$/i.exec(stage);
  if (groupMatch) {
    const week = Number(gameWeekRaw);
    return {
      stageType: StageType.GROUP,
      groupLabel: groupMatch[1].toUpperCase(),
      roundName: `Group Round ${week}`,
      roundNumber: week,
      sortOrder: week * 10
    };
  }

  const stageMap: Record<string, { stageType: StageType; roundName: string; sortOrder: number }> = {
    'Round of 32': { stageType: StageType.R32, roundName: 'Round of 32', sortOrder: 40 },
    'Round of 16': { stageType: StageType.R16, roundName: 'Round of 16', sortOrder: 50 },
    'Quarter Final': { stageType: StageType.QF, roundName: 'Quarter Finals', sortOrder: 60 },
    'Quarter Finals': { stageType: StageType.QF, roundName: 'Quarter Finals', sortOrder: 60 },
    'Semi Final': { stageType: StageType.SF, roundName: 'Semi Finals', sortOrder: 70 },
    'Semi Finals': { stageType: StageType.SF, roundName: 'Semi Finals', sortOrder: 70 },
    'Third Place Playoff': { stageType: StageType.THIRD, roundName: 'Third Place Playoff', sortOrder: 80 },
    Final: { stageType: StageType.FINAL, roundName: 'Final', sortOrder: 90 }
  };

  const mapped = stageMap[stage];
  if (!mapped) throw new Error(`Unsupported stage: ${stage}`);
  return { ...mapped, groupLabel: null, roundNumber: null };
}

export function parseFixtureRow(row: CsvFixtureRow): ParsedFixtureInput {
  const kickoffAtUtc = fromZonedTime(new Date(row.Date), 'Europe/London');
  const stage = mapStage(row.Stage, row['Game Week']);

  return {
    competitionId: row.CompetitionID,
    fixtureNumber: Number(row['Fixture Number']),
    kickoffAtUtc,
    ...stage,
    homeTeamName: row.Home_TeamID.trim(),
    awayTeamName: row.Away_TeamID.trim(),
    stadiumId: row.StadiumID?.trim() || null,
    creator: row.Creator?.trim() || null,
    uniqueImportId: row['unique id']?.trim() || null
  };
}

export function parseFixtures(csvRaw: string): ParsedFixtureInput[] {
  return parseCsvRows(csvRaw).map(parseFixtureRow);
}

export type ImportPreview = {
  createCount: number;
  updateCount: number;
  items: ParsedFixtureInput[];
};
