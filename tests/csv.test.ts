import { describe, expect, it } from 'vitest';
import { mapStage, parseFixtures } from '@/lib/csvImport';

describe('csv upsert behavior helpers', () => {
  it('parses and maps expected fields', () => {
    const csv = `CompetitionID,Date,Stage,Game Week,Home_TeamID,Away_TeamID,Fixture Number\nWC2026,Jun 14, 2024 7:00 pm,Group A,1,England,France,1`;
    // keep date with comma quoted for parser correctness
    const fixedCsv = `CompetitionID,Date,Stage,Game Week,Home_TeamID,Away_TeamID,Fixture Number\nWC2026,"Jun 14, 2024 7:00 pm",Group A,1,England,France,1`;
    const items = parseFixtures(fixedCsv);
    expect(items).toHaveLength(1);
    expect(items[0].roundName).toBe('Group Round 1');
    expect(items[0].sortOrder).toBe(10);
  });

  it('maps knockout stages', () => {
    const mapped = mapStage('Quarter Finals', '0');
    expect(mapped.stageType).toBe('QF');
    expect(mapped.sortOrder).toBe(60);
  });
});
