'use client';

import { LockKeyhole } from 'lucide-react';
import { useState } from 'react';

import { ChapterLogo } from '@/components/chapter-logo';
import { api, ApiError, session } from '@/lib/api';

import type { AdminUser } from './types';

export function AdminLogin({ onSignedIn }: { onSignedIn: (admin: AdminUser) => void }) {
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);

  async function signIn(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const remember = form.get('remember') === 'on';
    setBusy(true);
    setMessage(null);
    try {
      const result = await api<{ token: string; admin: AdminUser }>('/api/auth/login', {
        method: 'POST',
        body: { login: form.get('login'), password: form.get('password'), remember },
      });
      session.set(result.token, remember);
      onSignedIn(result.admin);
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof ApiError ? error.message : 'Could not sign in.' });
    } finally {
      setBusy(false);
    }
  }

  async function forgot(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const result = await api<{ message: string }>('/api/auth/forgot', { method: 'POST', body: { login: form.get('login') } });
      setMessage({ tone: 'info', text: result.message });
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof ApiError ? error.message : 'Try again in a minute.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-auth">
      <div className="admin-auth-card">
        <ChapterLogo className="admin-auth-mark" />
        <h1>{mode === 'login' ? 'Officer sign in' : 'Reset your password'}</h1>
        <p className="admin-auth-lead">
          {mode === 'login'
            ? 'For IEEE Sooners officers. Sign in with your username or Gmail.'
            : 'Enter your username or Gmail and we will email you a reset link.'}
        </p>
        {mode === 'login' ? (
          <form onSubmit={signIn} className="admin-form">
            <label>
              <span>Username or Gmail</span>
              <input name="login" required autoComplete="username" autoCapitalize="none" spellCheck={false} />
            </label>
            <label>
              <span>Password</span>
              <input name="password" type="password" required autoComplete="current-password" />
            </label>
            <label className="admin-check">
              <input type="checkbox" name="remember" />
              <span>Keep me signed in on this device for 30 days</span>
            </label>
            <button className="button button-crimson" type="submit" disabled={busy}>
              <LockKeyhole aria-hidden="true" />
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={forgot} className="admin-form">
            <label>
              <span>Username or Gmail</span>
              <input name="login" required autoComplete="username" autoCapitalize="none" spellCheck={false} />
            </label>
            <button className="button button-crimson" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Email me a reset link'}
            </button>
          </form>
        )}
        {message && (
          <output className={message.tone === 'error' ? 'admin-error' : 'admin-info'}>
            {message.text}
          </output>
        )}
        <button
          type="button"
          className="admin-link-button"
          onClick={() => {
            setMode(mode === 'login' ? 'forgot' : 'login');
            setMessage(null);
          }}
        >
          {mode === 'login' ? 'Forgot your password?' : 'Back to sign in'}
        </button>
      </div>
    </div>
  );
}

export function AdminReset({ token, onDone }: { token: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get('password') !== form.get('confirm')) {
      setMessage({ tone: 'error', text: 'The two passwords do not match.' });
      return;
    }
    setBusy(true);
    try {
      await api('/api/auth/reset', { method: 'POST', body: { token, password: form.get('password') } });
      setMessage({ tone: 'info', text: 'Password updated. Sign in with your new password.' });
      setTimeout(onDone, 1200);
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof ApiError ? error.message : 'Try again.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-auth">
      <div className="admin-auth-card">
        <ChapterLogo className="admin-auth-mark" />
        <h1>Choose a new password</h1>
        <form onSubmit={submit} className="admin-form">
          <label>
            <span>New password (12+ characters)</span>
            <input name="password" type="password" minLength={12} required autoComplete="new-password" />
          </label>
          <label>
            <span>Repeat it</span>
            <input name="confirm" type="password" minLength={12} required autoComplete="new-password" />
          </label>
          <button className="button button-crimson" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save password'}
          </button>
        </form>
        {message && (
          <output className={message.tone === 'error' ? 'admin-error' : 'admin-info'}>
            {message.text}
          </output>
        )}
      </div>
    </div>
  );
}
