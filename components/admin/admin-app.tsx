'use client';

import { FileText, Inbox, LogOut, UserRound, Users } from 'lucide-react';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { api, apiConfigured, session } from '@/lib/api';

import { AdminInviteAccept, AdminLogin, AdminReset } from './admin-login';
import { AccountPanel, PostsPanel, UsersPanel } from './admin-panels';
import { InboxPanel } from './inbox-panel';
import { PostEditor } from './post-editor';
import type { AdminUser, InboxCounts } from './types';

type Tab = 'posts' | 'inbox' | 'users' | 'account';

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: 'posts', label: 'News posts', icon: FileText },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'users', label: 'Admins', icon: Users },
  { id: 'account', label: 'My account', icon: UserRound },
];

const noSubscribe = () => () => {};
const readResetToken = () => /#reset=([\w-]+)/.exec(window.location.hash)?.[1] ?? '';
// Invite links look like /admin?invite=<token> (a #invite= hash works too).
const readInviteToken = () => new URLSearchParams(window.location.search).get('invite') ?? /#invite=([\w-]+)/.exec(window.location.hash)?.[1] ?? '';
const readHasSession = () => session.get() !== null;

export function AdminApp() {
  // Both are null while prerendering, then read once from the browser.
  const resetToken = useSyncExternalStore(noSubscribe, readResetToken, () => null);
  const inviteToken = useSyncExternalStore(noSubscribe, readInviteToken, () => null);
  const hasSession = useSyncExternalStore(noSubscribe, readHasSession, () => null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [inviteDone, setInviteDone] = useState(false);
  const [counts, setCounts] = useState<InboxCounts | null>(null);
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

  // Unread messages + new sponsor applications for the nav badge.
  const signedInId = admin?.id;
  const refreshCounts = useCallback(() => {
    api<InboxCounts>('/api/admin/inbox/counts', { auth: true })
      .then(setCounts)
      .catch(() => setCounts(null));
  }, []);
  useEffect(() => {
    if (signedInId !== undefined) refreshCounts();
  }, [signedInId, refreshCounts]);

  const status =
    hasSession === null
      ? 'checking'
      : resetToken && !resetDone
        ? 'reset'
        : inviteToken && !inviteDone
          ? 'invite'
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
  if (status === 'invite' && inviteToken) {
    const leave = () => {
      // Drop the token from the address bar so it isn't bookmarked or shared by accident.
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      if (url.hash.startsWith('#invite=')) url.hash = '';
      history.replaceState(null, '', url.pathname + url.search + url.hash);
      setInviteDone(true);
    };
    return (
      <AdminInviteAccept
        token={inviteToken}
        onSignedIn={(next) => {
          leave();
          setSessionChecked(true);
          setAdmin(next);
        }}
        onCancel={leave}
      />
    );
  }
  if (!admin) return <AdminLogin onSignedIn={setAdmin} />;

  const me = admin;
  const badge = counts ? counts.messages + counts.applications : 0;

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
              refreshCounts();
            }}
          >
            <Icon aria-hidden="true" />
            {label}
            {id === 'inbox' && badge > 0 && (
              <span className="admin-nav-badge" title={`${badge} waiting`}>
                {badge}
                <span className="admin-visually-hidden"> waiting</span>
              </span>
            )}
          </button>
        ))}
        <button type="button" className="admin-nav-signout" onClick={signOut}>
          <LogOut aria-hidden="true" />
          Sign out
        </button>
      </nav>
      <div className="admin-main">
        {tab === 'posts' && (editing === undefined ? <PostsPanel onEdit={setEditing} /> : <PostEditor key={editing ?? 'new'} postId={editing} onBack={() => setEditing(undefined)} />)}
        {tab === 'inbox' && <InboxPanel isOwner={me.role === 'owner'} onChange={refreshCounts} />}
        {tab === 'users' && <UsersPanel me={me} />}
        {tab === 'account' && <AccountPanel me={me} onUpdated={setAdmin} />}
      </div>
    </div>
  );
}
