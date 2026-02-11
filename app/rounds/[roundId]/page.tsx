import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isRoundLocked } from '@/lib/lock';

export default async function RoundPage({ params }: { params: { roundId: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const round = await prisma.round.findUnique({
    where: { id: params.roundId },
    include: {
      fixtures: {
        include: {
          homeTeam: true,
          awayTeam: true,
          predictions: { include: { user: true } }
        }
      }
    }
  });

  if (!round) return <p>Round not found</p>;
  const locked = isRoundLocked({ lockAtUtc: round.lockAtUtc, nowUtc: new Date() });

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">{round.name}</h1>
      <p>{locked ? 'Round locked: all picks visible' : 'Round open: only your picks visible'}</p>
      {round.fixtures.map((fixture) => (
        <div key={fixture.id} className="bg-white rounded p-3 shadow">
          <h2 className="font-medium">{fixture.homeTeam.name} vs {fixture.awayTeam.name}</h2>
          <ul className="text-sm">
            {fixture.predictions
              .filter((p) => locked || p.userId === userId)
              .map((p) => (
                <li key={p.id}>
                  {p.user.displayName}: {p.outcome}
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
