import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const leagueId = searchParams.get('leagueId');

  const active = await prisma.competition.findFirst({ where: { isActive: true } });
  if (!active) return NextResponse.json([]);

  const paid = await prisma.paymentStatus.findMany({ where: { competitionId: active.id, isPaid: true } });
  const paidIds = new Set(paid.map((p) => p.userId));

  let allowedIds = paidIds;
  if (leagueId) {
    const leagueMembers = await prisma.leagueMember.findMany({ where: { leagueId } });
    const membersSet = new Set(leagueMembers.map((m) => m.userId));
    allowedIds = new Set([...paidIds].filter((id) => membersSet.has(id)));
  }

  const users = await prisma.user.findMany({ where: { id: { in: [...allowedIds] } } });
  const points = await prisma.pointsAward.findMany({ where: { competitionId: active.id, userId: { in: [...allowedIds] } } });

  const rows = users.map((u) => {
    const userPoints = points.filter((p) => p.userId === u.id);
    return {
      userId: u.id,
      displayName: u.displayName,
      totalPoints: userPoints.reduce((sum, p) => sum + p.points, 0),
      pensHits: userPoints.filter((p) => p.points === 7).length,
      exactGoldenGoalHits: userPoints.filter((p) => p.category === 'GOLDEN_GOAL' && (p.metadata as any)?.exact === true).length
    };
  });

  rows.sort((a, b) => b.totalPoints - a.totalPoints || b.pensHits - a.pensHits || b.exactGoldenGoalHits - a.exactGoldenGoalHits || a.displayName.localeCompare(b.displayName));

  return NextResponse.json(rows);
}
