import { prisma } from '@/lib/prisma';
import { formatInTimeZone } from 'date-fns-tz';

export default async function HomePage() {
  const active = await prisma.competition.findFirst({ where: { isActive: true } });
  const rounds = active
    ? await prisma.round.findMany({
        where: { competitionId: active.id },
        orderBy: { sortOrder: 'asc' },
        include: { fixtures: { include: { homeTeam: true, awayTeam: true }, orderBy: { kickoffAtUtc: 'asc' } } }
      })
    : [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">World Cup Tipping App</h1>
      {!active ? <p>No active competition</p> : <p>Active competition: {active.name}</p>}
      {rounds.map((round) => (
        <section key={round.id} className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold">{round.name}</h2>
          <p className="text-xs text-slate-500">Lock: {formatInTimeZone(round.lockAtUtc, 'Europe/London', 'dd MMM yyyy HH:mm')}</p>
          <ul className="mt-2 text-sm space-y-1">
            {round.fixtures.map((fixture) => (
              <li key={fixture.id}>
                #{fixture.fixtureNumber} {fixture.homeTeam.name} vs {fixture.awayTeam.name} ({formatInTimeZone(fixture.kickoffAtUtc, 'Europe/London', 'dd MMM HH:mm')})
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
