import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1)
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const passwordHash = await hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: { email: parsed.data.email, passwordHash, displayName: parsed.data.displayName }
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
