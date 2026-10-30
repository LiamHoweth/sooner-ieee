'use client';

import { Copy, Download, ExternalLink, Link2, Pin, Plus, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { postHref } from '@/components/post-feed';
import { api, ApiError, downloadFile } from '@/lib/api';
import { formatPostDate, isExpired, type Post } from '@/lib/posts';

import { type AdminInvite, type AdminUser, formatDateTime } from './types';

export function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const reload = useCallback(() => {
    api<T>(path, { auth: true })
      .then((result) => {
        setData(result);
        setError('');
      })
      .catch((problem) => setError(problem instanceof ApiError ? problem.message : 'Could not load.'));
  }, [path]);
  useEffect(reload, [reload]);
  return { data, error, reload };
}

// ------------------------------------------------------------- news posts

export function PostsPanel({ onEdit }: { onEdit: (id: number | null) => void }) {
  const { data, error } = useLoad<{ posts: Post[] }>('/api/admin/posts');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [now] = useState(() => Date.now());
  const posts = (data?.posts ?? []).filter((post) => filter === 'all' || post.status === filter);

  return (
    <section className="admin-panel">
      <header className="admin-panel-head">
        <div>
          <h1>News posts</h1>
          <p>Write recaps, announcements and opportunities for the News page. Drafts stay private until you publish.</p>
        </div>
        <button type="button" className="button button-crimson" onClick={() => onEdit(null)}>
          <Plus aria-hidden="true" />
          New post
        </button>
      </header>
      <div className="admin-tabs-inline" role="toolbar" aria-label="Filter news posts">
        {(['all', 'published', 'draft'] as const).map((value) => (
          <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {value === 'all' ? 'All' : value === 'published' ? 'Published' : 'Drafts'}
          </button>
        ))}
      </div>
      {error && <p className="admin-error">{error}</p>}
      {data && posts.length === 0 && <p className="admin-muted">No news posts here yet. Start one with “New post”.</p>}
      <ul className="admin-list">
        {posts.map((post) => {
          const scheduled = post.status === 'published' && post.publishedAt && Date.parse(post.publishedAt) > now;
          const expired = post.status === 'published' && isExpired(post, now);
          return (
            <li key={post.id}>
              <button type="button" className="admin-list-main" onClick={() => onEdit(post.id)}>
                {post.cover ? <img src={post.cover.url} alt="" /> : <span className="admin-list-blank" aria-hidden="true" />}
                <span>
                  <strong>{post.title}</strong>
                  <small>
                    {post.category} · {scheduled ? `Scheduled for ${formatPostDate(post.publishedAt)}` : post.status === 'published' ? `Published ${formatPostDate(post.publishedAt)}` : `Draft, edited ${formatDateTime(post.updatedAt)}`}
                    {post.author ? ` · ${post.author}` : ''}
                    {post.expiresAt && !expired ? ` · Hides ${formatDateTime(post.expiresAt)}` : ''}
                  </small>
                </span>
              </button>
              <span className="admin-list-tags">
                {post.pinned && (
                  <span className="admin-pill">
                    <Pin aria-hidden="true" />
                    Pinned
                  </span>
                )}
                {expired ? (
                  <span className="admin-pill admin-pill-expired" title="Hidden from the News page. Its link still works.">
                    Expired
                  </span>
                ) : (
                  <span className={post.status === 'published' ? 'admin-pill admin-pill-live' : 'admin-pill'}>
                    {scheduled ? 'Scheduled' : post.status === 'published' ? 'Live' : 'Draft'}
                  </span>
                )}
                {post.status === 'published' && !scheduled && (
                  <a className="admin-icon-button" href={postHref(post.slug)} target="_blank" rel="noreferrer" aria-label={`View ${post.title} on the site`}>
                    <ExternalLink aria-hidden="true" />
                  </a>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------ admin users

export function UsersPanel({ me }: { me: AdminUser }) {
  const { data, error, reload } = useLoad<{ admins: AdminUser[] }>('/api/admin/users');
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const isOwner = me.role === 'owner';

  async function create(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api('/api/admin/users', {
        method: 'POST',
        auth: true,
        body: {
          username: form.get('username'),
          displayName: form.get('displayName'),
          email: form.get('email'),
          role: form.get('role'),
          password: form.get('password'),
        },
      });
      setNotice({ tone: 'info', text: 'Admin added. Send them their username and temporary password privately, and ask them to change it.' });
      setAdding(false);
      reload();
    } catch (problem) {
      setNotice({ tone: 'error', text: problem instanceof ApiError ? problem.message : 'Could not add that admin.' });
    }
  }

  async function update(admin: AdminUser, change: Record<string, unknown>, message: string) {
    try {
      await api(`/api/admin/users/${admin.id}`, { method: 'PATCH', auth: true, body: change });
      setNotice({ tone: 'info', text: message });
      reload();
    } catch (problem) {
      setNotice({ tone: 'error', text: problem instanceof ApiError ? problem.message : 'Could not update.' });
    }
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel-head">
        <div>
          <h1>Admins</h1>
          <p>
            Everyone who can sign in here. Owners manage accounts and backups; admins write news posts and answer the inbox.
          </p>
        </div>
        {isOwner && (
          <button type="button" className="button button-outline" onClick={() => setAdding(!adding)}>
            <UserPlus aria-hidden="true" />
            Add with a password
          </button>
        )}
      </header>
      {isOwner && <InvitesCard />}
      {notice && (
        <output className={notice.tone === 'error' ? 'admin-error' : 'admin-info'}>
          {notice.text}
        </output>
      )}
      {error && <p className="admin-error">{error}</p>}
      {adding && (
        <form className="admin-form admin-card" onSubmit={create}>
          <h2>New admin</h2>
          <div className="admin-row">
            <label>
              <span>Name</span>
              <input name="displayName" required maxLength={80} placeholder="Nathan Smith" />
            </label>
            <label>
              <span>Username</span>
              <input name="username" required pattern="[a-z0-9._\-]{3,32}" maxLength={32} placeholder="nathan" autoCapitalize="none" />
            </label>
          </div>
          <div className="admin-row">
            <label>
              <span>Gmail</span>
              <input name="email" type="email" required maxLength={200} placeholder="name@gmail.com" />
            </label>
            <label>
              <span>Role</span>
              <select name="role" defaultValue="admin">
                <option value="admin">Admin: news posts and inbox</option>
                <option value="owner">Owner: also manages admins and backups</option>
              </select>
            </label>
          </div>
          <label>
            <span>Temporary password (12+ characters)</span>
            <input name="password" type="text" required minLength={12} autoComplete="off" />
          </label>
          <div className="admin-row-actions">
            <button className="button button-crimson" type="submit">
              Create account
            </button>
            <button type="button" className="admin-link-button" onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      <ul className="admin-people">
        {(data?.admins ?? []).map((admin) => (
          <li key={admin.id} className={admin.disabled_at ? 'is-disabled' : undefined}>
            <div>
              <strong>
                {admin.display_name} {admin.id === me.id && <small>(you)</small>}
              </strong>
              <small>
                @{admin.username} · {admin.email}
              </small>
              <small>Last sign-in: {formatDateTime(admin.last_login_at)}</small>
            </div>
            <span className={admin.role === 'owner' ? 'admin-pill admin-pill-live' : 'admin-pill'}>
              {admin.disabled_at ? 'Disabled' : admin.role === 'owner' ? 'Owner' : 'Admin'}
            </span>
            {isOwner && admin.id !== me.id && (
              <div className="admin-people-actions">
                <button
                  type="button"
                  className="admin-link-button"
                  onClick={() =>
                    update(admin, { role: admin.role === 'owner' ? 'admin' : 'owner' }, `${admin.display_name} is now ${admin.role === 'owner' ? 'an admin' : 'an owner'}.`)
                  }
                >
                  {admin.role === 'owner' ? 'Make admin' : 'Make owner'}
                </button>
                <button
                  type="button"
                  className="admin-link-button"
                  onClick={() => {
                    const password = window.prompt(`New temporary password for ${admin.display_name} (12+ characters):`);
                    if (password) void update(admin, { password }, `Password reset. ${admin.display_name} has been signed out everywhere.`);
                  }}
                >
                  Reset password
                </button>
                <button
                  type="button"
                  className="admin-link-button"
                  onClick={() =>
                    update(
                      admin,
                      { disabled: !admin.disabled_at },
                      admin.disabled_at ? `${admin.display_name} can sign in again.` : `${admin.display_name} is disabled and signed out.`,
                    )
                  }
                >
                  {admin.disabled_at ? 'Enable' : 'Disable'}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------- invites

function InvitesCard() {
  const { data, error, reload } = useLoad<{ invites: AdminInvite[] }>('/api/admin/invites');
  const [inviting, setInviting] = useState(false);
  const [created, setCreated] = useState<{ url: string; expiresAt: string; emailed: boolean; to: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);

  async function invite(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawEmail = form.get('email');
    const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
    try {
      const result = await api<{ invite: AdminInvite; url: string; emailed: boolean }>('/api/admin/invites', {
        method: 'POST',
        auth: true,
        body: { email, displayName: form.get('displayName'), role: form.get('role'), sendEmail: form.get('sendEmail') === 'on' },
      });
      setCreated({ url: result.url, expiresAt: result.invite.expiresAt, emailed: result.emailed, to: email });
      setCopied(false);
      setInviting(false);
      setNotice(null);
      reload();
    } catch (problem) {
      setNotice({ tone: 'error', text: problem instanceof ApiError ? problem.message : 'Could not create the invite.' });
    }
  }

  async function copy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.url);
      setCopied(true);
    } catch {
      // Clipboard blocked (older browser or insecure context): select the text so it can be copied by hand.
      (document.getElementById('admin-invite-url') as HTMLInputElement | null)?.select();
    }
  }

  async function revoke(item: AdminInvite) {
    if (!window.confirm('Cancel this invite? The link stops working straight away.')) return;
    try {
      await api(`/api/admin/invites/${item.id}`, { method: 'DELETE', auth: true });
      setNotice({ tone: 'info', text: 'Invite cancelled.' });
      reload();
    } catch (problem) {
      setNotice({ tone: 'error', text: problem instanceof ApiError ? problem.message : 'Could not cancel the invite.' });
    }
  }

  const invites = data?.invites ?? [];

  return (
    <div className="admin-card">
      <div className="admin-invite-head">
        <div>
          <h2>Invite an officer</h2>
          <p className="admin-muted">
            Make a one-time link instead of typing a password for them. They pick their own username and password. Links expire after 7 days.
          </p>
        </div>
        <button type="button" className="button button-crimson" onClick={() => setInviting(!inviting)}>
          <Link2 aria-hidden="true" />
          Invite officer
        </button>
      </div>
      {notice && <output className={notice.tone === 'error' ? 'admin-error' : 'admin-info'}>{notice.text}</output>}
      {error && <p className="admin-error">{error}</p>}
      {inviting && (
        <form className="admin-form" onSubmit={invite}>
          <div className="admin-row">
            <label>
              <span>Name (optional)</span>
              <input name="displayName" maxLength={80} />
            </label>
            <label>
              <span>Gmail (optional)</span>
              <input name="email" type="email" maxLength={200} autoCapitalize="none" />
            </label>
            <label>
              <span>Role</span>
              <select name="role" defaultValue="admin">
                <option value="admin">Admin: news posts and inbox</option>
                <option value="owner">Owner: also manages admins and backups</option>
              </select>
            </label>
          </div>
          <label className="admin-check">
            <input type="checkbox" name="sendEmail" />
            <span>Also email the link to that address (only works if site email is set up)</span>
          </label>
          <div className="admin-row-actions">
            <button className="button button-crimson" type="submit">
              Create invite link
            </button>
            <button type="button" className="admin-link-button" onClick={() => setInviting(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {created && (
        <div className="admin-invite-link">
          <label>
            <span>Invite link: send it privately. It works once and is only shown now.</span>
            <input id="admin-invite-url" readOnly value={created.url} onFocus={(event) => event.currentTarget.select()} />
          </label>
          <button type="button" className="button button-outline" onClick={() => void copy()}>
            <Copy aria-hidden="true" />
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <small>
            Expires {formatDateTime(created.expiresAt)}.
            {created.emailed ? ` Also emailed to ${created.to}.` : ''}
          </small>
        </div>
      )}
      {invites.length > 0 && (
        <>
          <h3 className="admin-invite-subhead">Waiting to be accepted</h3>
          <ul className="admin-people">
            {invites.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.displayName || item.email || 'Unnamed invite'}</strong>
                  <small>
                    {item.email && item.displayName ? `${item.email} · ` : ''}
                    {item.role === 'owner' ? 'Owner' : 'Admin'} · made {formatDateTime(item.createdAt)}
                    {item.createdBy ? ` by ${item.createdBy}` : ''}
                  </small>
                  <small>Expires {formatDateTime(item.expiresAt)}</small>
                </div>
                <button type="button" className="admin-link-button" onClick={() => void revoke(item)}>
                  Cancel invite
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- account

export function AccountPanel({ me, onUpdated }: { me: AdminUser; onUpdated: (admin: AdminUser) => void }) {
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);
  const activity = useLoad<{ activity: { action: string; target: string; created_at: string; display_name: string | null }[] }>('/api/admin/activity');

  async function saveProfile(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const { admin } = await api<{ admin: AdminUser }>('/api/auth/me', {
        method: 'PATCH',
        auth: true,
        body: { displayName: form.get('displayName'), email: form.get('email') },
      });
      onUpdated(admin);
      setNotice({ tone: 'info', text: 'Profile saved.' });
    } catch (problem) {
      setNotice({ tone: 'error', text: problem instanceof ApiError ? problem.message : 'Could not save.' });
    }
  }

  async function changePassword(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (form.get('next') !== form.get('confirm')) {
      setNotice({ tone: 'error', text: 'The new passwords do not match.' });
      return;
    }
    try {
      await api('/api/auth/password', { method: 'POST', auth: true, body: { current: form.get('current'), next: form.get('next') } });
      formElement.reset();
      setNotice({ tone: 'info', text: 'Password changed. Other devices have been signed out.' });
    } catch (problem) {
      setNotice({ tone: 'error', text: problem instanceof ApiError ? problem.message : 'Could not change the password.' });
    }
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel-head">
        <div>
          <h1>My account</h1>
          <p>Signed in as @{me.username}.</p>
        </div>
      </header>
      {notice && (
        <output className={notice.tone === 'error' ? 'admin-error' : 'admin-info'}>
          {notice.text}
        </output>
      )}
      <div className="admin-two">
        <form className="admin-form admin-card" onSubmit={saveProfile}>
          <h2>Profile</h2>
          <label>
            <span>Name shown on posts</span>
            <input name="displayName" defaultValue={me.display_name} required maxLength={80} />
          </label>
          <label>
            <span>Gmail (for password resets and inbox alerts)</span>
            <input name="email" type="email" defaultValue={me.email} required maxLength={200} />
          </label>
          <button className="button button-crimson" type="submit">
            Save profile
          </button>
        </form>
        <form className="admin-form admin-card" onSubmit={changePassword}>
          <h2>Password</h2>
          <label>
            <span>Current password</span>
            <input name="current" type="password" required autoComplete="current-password" />
          </label>
          <label>
            <span>New password (12+ characters)</span>
            <input name="next" type="password" required minLength={12} autoComplete="new-password" />
          </label>
          <label>
            <span>Repeat new password</span>
            <input name="confirm" type="password" required minLength={12} autoComplete="new-password" />
          </label>
          <button className="button button-crimson" type="submit">
            Change password
          </button>
        </form>
      </div>

      {me.role === 'owner' && (
        <div className="admin-card">
          <h2>Backups</h2>
          <p className="admin-muted">
            Download a copy before handing the site to a new webmaster, and once a semester. The database file holds every post, message, application and
            admin account; the export is a readable JSON copy of the content. See docs/HANDOFF.md.
          </p>
          <div className="admin-row-actions">
            <button type="button" className="button button-outline" onClick={() => void downloadFile('/api/admin/backup.sqlite', 'ieee-sooners.sqlite')}>
              <Download aria-hidden="true" />
              Database backup
            </button>
            <button type="button" className="button button-outline" onClick={() => void downloadFile('/api/admin/export', 'ieee-sooners-export.json')}>
              <Download aria-hidden="true" />
              Content export (JSON)
            </button>
          </div>
        </div>
      )}

      <div className="admin-card">
        <h2>Recent activity</h2>
        <ul className="admin-activity">
          {(activity.data?.activity ?? []).slice(0, 25).map((item, index) => (
            <li key={index}>
              <span>{formatDateTime(item.created_at)}</span>
              <span>
                {item.display_name ?? 'System'} · {item.action.replace(/-/g, ' ')}
                {item.target ? ` (${item.target})` : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
