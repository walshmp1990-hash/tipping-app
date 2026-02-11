import { NextResponse } from 'next/server';
import { recalculateAllActiveCompetition, recalculateFixturePoints } from '@/lib/services';

export async function POST(req: Request) {
  const body = await req.json();
  if (body.fixtureId) {
    await recalculateFixturePoints(String(body.fixtureId));
    return NextResponse.json({ ok: true, scope: 'fixture' });
  }
  await recalculateAllActiveCompetition();
  return NextResponse.json({ ok: true, scope: 'competition' });
}
