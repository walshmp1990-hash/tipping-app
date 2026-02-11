import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({ name: z.string().min(1) });
const joinSchema = z.object({ joinCode: z.string().min(4) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  if (body.action === 'create') {
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const active = await prisma.competition.findFirst({ where: { isActive: true } });
    if (!active) return NextResponse.json({ error: 'No active competition' }, { status: 400 });
    const joinCode = randomBytes(3).toString('hex').toUpperCase();
    const league = await prisma.league.create({
      data: {
        competitionId: active.id,
        name: parsed.data.name,
        createdByUserId: userId,
        joinCode,
        members: { create: { userId, role: 'OWNER' } }
      }
    });
    return NextResponse.json(league);
  }

  if (body.action === 'join') {
    const parsed = joinSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const league = await prisma.league.findUnique({ where: { joinCode: parsed.data.joinCode } });
    if (!league) return NextResponse.json({ error: 'Invalid code' }, { status: 404 });
    await prisma.leagueMember.upsert({
      where: { leagueId_userId: { leagueId: league.id, userId } },
      update: {},
      create: { leagueId: league.id, userId, role: 'MEMBER' }
    });
    return NextResponse.json({ ok: true, leagueId: league.id });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
