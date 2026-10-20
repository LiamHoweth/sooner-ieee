'use client';

import { FileText, Handshake, LogOut, UserRound, Users } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { api, apiConfigured, session } from '@/lib/api';

import { AdminLogin, AdminReset } from './admin-login';
import { AccountPanel, ApplicationsPanel, PostsPanel, UsersPanel } from './admin-panels';
import { PostEditor } from './post-editor';
import type { AdminUser } from './types';

type Tab = 'posts' | 'applications' | 'users' | 'account';

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'applications', label: 'Sponsor applications', icon: Handshake },
  { id: 'users', label: 'Admins', icon: Users },
  { id: 'account', label: 'My account', icon: UserRound },
];

const noSubscribe = () => () => {};
const readResetToken = () => /#reset=([\w-]+)/.exec(window.location.hash)?.[1] ?? '';
const readHasSession = () => session.get() !== null;

export function AdminApp() {
  // Both are null while prerendering, then read once from the browser.
  const resetToken = useSyncExternalStore(noSubscribe, readResetToken, () => null);
  const hasSession = useSyncExternalStore(noSubscribe, readHasSession, () => null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [tab, setTab] = useState<Tab>('posts');
  const [editing, setEditing] = useState<number | null | undefined>(undefined);

  // Confirm a remembered session is still valid before showing the dashboard.
  useEffect(() => {
    if (!hasSession || !apiConfigured || sessionChecked) return;
    let cancelled = false;
    api<{ admin: AdminUser }>('/api/auth/me', { auth: true })
      .then(({ admin: current }) => {
        if (!cancelled) setAdmin(current);
      })
      .catch(() => session.clear())
      .finally(() => {
        if (!cancelled) setSessionChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hasSession, sessionChecked]);

  const status =
    hasSession === null
      ? 'checking'
      : resetToken && !resetDone
        ? 'reset'
        : admin
          ? 'signed-in'
          : hasSession && !sessionChecked && apiConfigured
            ? 'checking'
            : 'signed-out';

  async function signOut() {
    await api('/api/auth/logout', { method: 'POST', auth: true }).catch(() => {});
    session.clear();
    setSessionChecked(true);
    setAdmin(null);
  }

  if (!apiConfigured) {
    return (
      <div className="admin-auth">
        <div className="admin-auth-card">
          <h1>Admin is not connected</h1>
          <p className="admin-auth-lead">
            This build has no API address. Set the <code>IEEE_API_URL</code> repository variable (or <code>NEXT_PUBLIC_API_URL</code> locally) and rebuild. See
            docs/BACKEND.md.
          </p>
        </div>
      </div>
    );
  }
  if (status === 'checking') return <div className="admin-auth" aria-busy="true" />;
  if (status === 'reset' && resetToken) {
    return (
      <AdminReset
        token={resetToken}
        onDone={() => {
          history.replaceState(null, '', window.location.pathname + window.location.search);
          setResetDone(true);
        }}
      />
    );
  }
  if (!admin) return <AdminLogin onSignedIn={setAdmin} />;

  const me = admin;

  return (
    <div className="admin-shell">
      <nav className="admin-nav" aria-label="Admin sections">
        <p className="admin-nav-who">
          <strong>{me.display_name}</strong>
          <small>{me.role === 'owner' ? 'Owner' : 'Admin'}</small>
        </p>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => {
              setTab(id);
              setEditing(undefined);
            }}
          >
            <Icon aria-hidden="true" />
            {label}
          </button>
        ))}
        <button type="button" className="admin-nav-signout" onClick={signOut}>
          <LogOut aria-hidden="true" />
          Sign out
        </button>
      </nav>
      <div className="admin-main">
        {tab === 'posts' && (editing === undefined ? <PostsPanel onEdit={setEditing} /> : <PostEditor key={editing ?? 'new'} postId={editing} onBack={() => setEditing(undefined)} />)}
        {tab === 'applications' && <ApplicationsPanel isOwner={me.role === 'owner'} />}
        {tab === 'users' && <UsersPanel me={me} />}
        {tab === 'account' && <AccountPanel me={me} onUpdated={setAdmin} />}
      </div>
    </div>
  );
}
