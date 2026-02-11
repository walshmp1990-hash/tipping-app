import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="bg-slate-900 text-white p-4">
          <nav className="max-w-5xl mx-auto flex gap-4 text-sm">
            <Link href="/">Home</Link>
            <Link href="/leaderboard">Leaderboard</Link>
            <Link href="/admin/import">Admin Import</Link>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
