import { LockContext } from './types';

export function isRoundLocked(ctx: LockContext): boolean {
  return ctx.nowUtc.getTime() >= ctx.lockAtUtc.getTime();
}

export function assertRoundEditable(ctx: LockContext) {
  if (isRoundLocked(ctx)) {
    throw new Error('Round is locked and predictions are read-only.');
  }
}
