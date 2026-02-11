import { describe, expect, it } from 'vitest';
import { assertRoundEditable, isRoundLocked } from '@/lib/lock';

describe('lock enforcement', () => {
  it('locks at lockAtUtc', () => {
    const lock = new Date('2024-06-14T18:00:00.000Z');
    expect(isRoundLocked({ lockAtUtc: lock, nowUtc: new Date('2024-06-14T17:59:59.000Z') })).toBe(false);
    expect(isRoundLocked({ lockAtUtc: lock, nowUtc: new Date('2024-06-14T18:00:00.000Z') })).toBe(true);
    expect(() => assertRoundEditable({ lockAtUtc: lock, nowUtc: new Date('2024-06-14T19:00:00.000Z') })).toThrow();
  });
});
