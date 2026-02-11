export default async function LeaderboardPage() {
  const res = await fetch(`${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/api/leaderboard`, { cache: 'no-store' });
  const rows = await res.json();

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Leaderboard (Paid Users)</h1>
      <table className="w-full bg-white rounded shadow text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="p-2">Name</th>
            <th className="p-2">Points</th>
            <th className="p-2">Pens Hits</th>
            <th className="p-2">Exact GG</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any) => (
            <tr key={row.userId} className="border-b last:border-none">
              <td className="p-2">{row.displayName}</td>
              <td className="p-2">{row.totalPoints}</td>
              <td className="p-2">{row.pensHits}</td>
              <td className="p-2">{row.exactGoldenGoalHits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
