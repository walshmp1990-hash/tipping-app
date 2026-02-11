import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { recalculateFixturePoints } from '@/lib/services';

const schema = z.object({
  fixtureId: z.string(),
  status: z.enum(['FINISHED', 'POSTPONED', 'CANCELLED']),
  homeFtGoals: z.number().int().nonnegative(),
  awayFtGoals: z.number().int().nonnegative(),
  homeEtGoals: z.number().int().nonnegative().nullable().optional(),
  awayEtGoals: z.number().int().nonnegative().nullable().optional(),
  wentToPens: z.boolean().optional(),
  pensWinnerTeamId: z.string().nullable().optional(),
  officialManOfMatch: z.string().nullable().optional(),
  openingGoalMinuteActual: z.number().int().min(1).max(120).nullable().optional()
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.matchResult.upsert({
    where: { fixtureId: parsed.data.fixtureId },
    update: parsed.data,
    create: parsed.data
  });

  await recalculateFixturePoints(parsed.data.fixtureId);

  return NextResponse.json({ ok: true });
}
