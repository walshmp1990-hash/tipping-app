'use client';

import { useState } from 'react';

export default function AdminImportPage() {
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<any>(null);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Admin CSV Import</h1>
      <textarea className="border p-2 w-full min-h-60" value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="Paste fixture CSV" />
      <div className="flex gap-2">
        <button
          className="bg-slate-700 text-white px-3 py-2 rounded"
          onClick={async () => {
            const res = await fetch('/api/admin/import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ csv, dryRun: true })
            });
            setPreview(await res.json());
          }}
        >
          Dry Run
        </button>
        <button
          className="bg-green-700 text-white px-3 py-2 rounded"
          onClick={async () => {
            const res = await fetch('/api/admin/import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ csv, dryRun: false })
            });
            setPreview(await res.json());
          }}
        >
          Apply Import
        </button>
      </div>
      {preview ? <pre className="bg-black text-green-200 p-3 rounded overflow-auto text-xs">{JSON.stringify(preview, null, 2)}</pre> : null}
    </div>
  );
}
