'use client';

import { LockKeyhole, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ChapterLogo } from '@/components/chapter-logo';
import { api, ApiError, session } from '@/lib/api';

import { type AdminInvite, type AdminUser, formatDateTime } from './types';

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

type InviteState =
  | { status: 'checking' }
  | { status: 'ready'; invite: Pick<AdminInvite, 'email' | 'displayName' | 'role' | 'expiresAt'> }
  | { status: 'gone'; message: string };

/** Shown instead of the sign-in form when /admin is opened from an invite link. */
export function AdminInviteAccept({ token, onSignedIn, onCancel }: { token: string; onSignedIn: (admin: AdminUser) => void; onCancel: () => void }) {
  const [state, setState] = useState<InviteState>({ status: 'checking' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ invite: Pick<AdminInvite, 'email' | 'displayName' | 'role' | 'expiresAt'> }>('/api/invites/lookup', { method: 'POST', body: { token } })
      .then(({ invite }) => {
        if (!cancelled) setState({ status: 'ready', invite });
      })
      .catch((error) => {
        if (!cancelled) setState({ status: 'gone', message: error instanceof ApiError ? error.message : 'Could not check this invite link.' });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function accept(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get('password') !== form.get('confirm')) {
      setMessage({ tone: 'error', text: 'The two passwords do not match.' });
      return;
    }
    const remember = form.get('remember') === 'on';
    setBusy(true);
    setMessage(null);
    try {
      const result = await api<{ token: string; admin: AdminUser }>('/api/invites/accept', {
        method: 'POST',
        body: {
          token,
          displayName: form.get('displayName'),
          username: form.get('username'),
          email: form.get('email'),
          password: form.get('password'),
          remember,
        },
      });
      session.set(result.token, remember);
      onSignedIn(result.admin);
    } catch (error) {
      setMessage({ tone: 'error', text: error instanceof ApiError ? error.message : 'Could not create your account.' });
      if (error instanceof ApiError && error.status === 410) setState({ status: 'gone', message: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-auth">
      <div className="admin-auth-card">
        <ChapterLogo className="admin-auth-mark" />
        <h1>{state.status === 'gone' ? 'Invite link not valid' : 'Set up your officer account'}</h1>
        {state.status === 'checking' && <p className="admin-auth-lead" aria-busy="true">Checking your invite…</p>}
        {state.status === 'gone' && <p className="admin-auth-lead">{state.message}</p>}
        {state.status === 'ready' && (
          <>
            <p className="admin-auth-lead">
              You&rsquo;ve been invited as {state.invite.role === 'owner' ? 'an owner' : 'an admin'}. Choose how you&rsquo;ll sign in. This link expires{' '}
              {formatDateTime(state.invite.expiresAt)}.
            </p>
            <form onSubmit={accept} className="admin-form">
              <label>
                <span>Your name (shown on news posts)</span>
                <input name="displayName" required maxLength={80} defaultValue={state.invite.displayName} autoComplete="name" />
              </label>
              <label>
                <span>Username</span>
                <input name="username" required pattern="[a-z0-9._\-]{3,32}" maxLength={32} autoCapitalize="none" spellCheck={false} autoComplete="username" />
                <small>3–32 lowercase letters, numbers, dots, dashes or underscores.</small>
              </label>
              <label>
                <span>Gmail (for password resets and inbox alerts)</span>
                <input name="email" type="email" required maxLength={200} defaultValue={state.invite.email} autoComplete="email" />
              </label>
              <label>
                <span>Password (12+ characters)</span>
                <input name="password" type="password" minLength={12} required autoComplete="new-password" />
              </label>
              <label>
                <span>Repeat it</span>
                <input name="confirm" type="password" minLength={12} required autoComplete="new-password" />
              </label>
              <label className="admin-check">
                <input type="checkbox" name="remember" />
                <span>Keep me signed in on this device for 30 days</span>
              </label>
              <button className="button button-crimson" type="submit" disabled={busy}>
                <UserPlus aria-hidden="true" />
                {busy ? 'Creating your account…' : 'Create account and sign in'}
              </button>
            </form>
          </>
        )}
        {message && <output className={message.tone === 'error' ? 'admin-error' : 'admin-info'}>{message.text}</output>}
        <button type="button" className="admin-link-button" onClick={onCancel}>
          {state.status === 'gone' ? 'Go to sign in' : 'I already have an account'}
        </button>
      </div>
    </div>
  );
}
