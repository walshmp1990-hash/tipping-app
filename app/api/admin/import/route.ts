import { NextResponse } from 'next/server';
import { importFixtures } from '@/lib/services';

export async function POST(req: Request) {
  const body = await req.json();
  const csv = String(body.csv ?? '');
  const dryRun = body.dryRun !== false;

  const result = await importFixtures(csv, dryRun);
  return NextResponse.json(result);
}
