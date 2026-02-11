import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assertRoundEditable } from '@/lib/lock';

const schema = z.object({
  fixtureId: z.string(),
  outcome: z.enum(['HOME_WIN', 'DRAW', 'AWAY_WIN', 'HOME_FT', 'HOME_ET', 'HOME_PENS', 'AWAY_FT', 'AWAY_ET', 'AWAY_PENS', 'DRAW_FT', 'DRAW_ET']),
  goldenGoalMinute: z.number().int().min(1).max(120).optional().nullable(),
  noGoal: z.boolean().optional(),
  manOfMatch: z.string().optional().nullable()
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const fixture = await prisma.fixture.findUnique({ where: { id: parsed.data.fixtureId }, include: { round: true } });
  if (!fixture) return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });

  assertRoundEditable({ lockAtUtc: fixture.round.lockAtUtc, nowUtc: new Date() });

  const userId = (session.user as any).id;
  await prisma.prediction.upsert({
    where: { userId_fixtureId: { userId, fixtureId: fixture.id } },
    update: { outcome: parsed.data.outcome },
    create: { userId, fixtureId: fixture.id, outcome: parsed.data.outcome }
  });

  await prisma.extraPrediction.upsert({
    where: { userId_fixtureId: { userId, fixtureId: fixture.id } },
    update: {
      goldenGoalMinute: parsed.data.goldenGoalMinute ?? null,
      noGoal: parsed.data.noGoal ?? false,
      manOfMatch: parsed.data.manOfMatch ?? null
    },
    create: {
      userId,
      fixtureId: fixture.id,
      goldenGoalMinute: parsed.data.goldenGoalMinute ?? null,
      noGoal: parsed.data.noGoal ?? false,
      manOfMatch: parsed.data.manOfMatch ?? null
    }
  });

  return NextResponse.json({ ok: true });
}
