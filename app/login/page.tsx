'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form
      className="space-y-3 max-w-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        await signIn('credentials', { email, password, callbackUrl: '/' });
      }}
    >
      <h1 className="text-xl font-semibold">Login</h1>
      <input className="border p-2 w-full" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="border p-2 w-full" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button className="bg-slate-900 text-white px-3 py-2 rounded w-full">Sign in</button>
    </form>
  );
}
