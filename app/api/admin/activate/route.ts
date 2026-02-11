import { NextResponse } from 'next/server';
import { activateCompetition } from '@/lib/competition';

export async function POST(req: Request) {
  const body = await req.json();
  const competitionId = String(body.competitionId ?? '');
  if (!competitionId) return NextResponse.json({ error: 'competitionId required' }, { status: 400 });
  const competition = await activateCompetition(competitionId);
  return NextResponse.json(competition);
}
