'use client';

import { useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');

  return (
    <form
      className="space-y-3 max-w-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, displayName })
        });
        setMessage(res.ok ? 'Registered' : 'Registration failed');
      }}
    >
      <h1 className="text-xl font-semibold">Register</h1>
      <input className="border p-2 w-full" placeholder="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <input className="border p-2 w-full" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="border p-2 w-full" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="bg-slate-900 text-white px-3 py-2 rounded w-full">Create account</button>
      <p>{message}</p>
    </form>
  );
}
