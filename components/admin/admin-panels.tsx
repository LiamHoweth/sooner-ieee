'use client';

import { Download, ExternalLink, Mail, Pin, Plus, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { postHref } from '@/components/post-feed';
import { api, ApiError, downloadFile } from '@/lib/api';
import { formatPostDate, type Post } from '@/lib/posts';

import { type AdminUser, formatDateTime, type SponsorApplication } from './types';

function useLoad<T>(path: string) {
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

// ------------------------------------------------------------------ posts

export function PostsPanel({ onEdit }: { onEdit: (id: number | null) => void }) {
  const { data, error } = useLoad<{ posts: Post[] }>('/api/admin/posts');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [now] = useState(() => Date.now());
  const posts = (data?.posts ?? []).filter((post) => filter === 'all' || post.status === filter);

  return (
    <section className="admin-panel">
      <header className="admin-panel-head">
        <div>
          <h1>Posts</h1>
          <p>Write recaps, announcements and opportunities. Drafts stay private until you publish.</p>
        </div>
        <button type="button" className="button button-crimson" onClick={() => onEdit(null)}>
          <Plus aria-hidden="true" />
          New post
        </button>
      </header>
      <div className="admin-tabs-inline" role="toolbar" aria-label="Filter posts">
        {(['all', 'published', 'draft'] as const).map((value) => (
          <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>
            {value === 'all' ? 'All' : value === 'published' ? 'Published' : 'Drafts'}
          </button>
        ))}
      </div>
      {error && <p className="admin-error">{error}</p>}
      {data && posts.length === 0 && <p className="admin-muted">No posts here yet. Start one with “New post”.</p>}
      <ul className="admin-list">
        {posts.map((post) => {
          const scheduled = post.status === 'published' && post.publishedAt && Date.parse(post.publishedAt) > now;
          return (
            <li key={post.id}>
              <button type="button" className="admin-list-main" onClick={() => onEdit(post.id)}>
                {post.cover ? <img src={post.cover.url} alt="" /> : <span className="admin-list-blank" aria-hidden="true" />}
                <span>
                  <strong>{post.title}</strong>
                  <small>
                    {post.category} · {scheduled ? `Scheduled for ${formatPostDate(post.publishedAt)}` : post.status === 'published' ? `Published ${formatPostDate(post.publishedAt)}` : `Draft, edited ${formatDateTime(post.updatedAt)}`}
                    {post.author ? ` · ${post.author}` : ''}
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
                <span className={post.status === 'published' ? 'admin-pill admin-pill-live' : 'admin-pill'}>
                  {scheduled ? 'Scheduled' : post.status === 'published' ? 'Live' : 'Draft'}
                </span>
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

// ----------------------------------------------------- sponsor applications

const STATUS_LABELS: Record<SponsorApplication['status'], string> = {
  new: 'New',
  contacted: 'Contacted',
  accepted: 'Accepted',
  declined: 'Declined',
};

const BUDGET_LABELS: Record<string, string> = {
  'under-500': 'Under $500',
  '500-1000': '$500 – $1,000',
  '1000-5000': '$1,000 – $5,000',
  '5000-plus': '$5,000+',
  'in-kind': 'In-kind',
  'not-sure': 'Not sure yet',
};

const INTEREST_LABELS: Record<string, string> = {
  speaker: 'Speaker / tech talk',
  workshop: 'Workshop',
  projects: 'Project materials',
  travel: 'Competition travel',
  events: 'Event sponsor',
  recruiting: 'Recruiting',
  other: 'Other',
};

export function ApplicationsPanel({ isOwner }: { isOwner: boolean }) {
  const { data, error, reload } = useLoad<{ applications: SponsorApplication[] }>('/api/admin/sponsor-applications');
  const [openId, setOpenId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');

  async function update(id: number, change: Partial<Pick<SponsorApplication, 'status' | 'notes'>>) {
    try {
      await api(`/api/admin/sponsor-applications/${id}`, { method: 'PATCH', body: change, auth: true });
      setNotice('Saved.');
      reload();
    } catch (problem) {
      setNotice(problem instanceof ApiError ? problem.message : 'Could not save.');
    }
  }

  async function remove(id: number) {
    if (!window.confirm('Delete this application for good?')) return;
    await api(`/api/admin/sponsor-applications/${id}`, { method: 'DELETE', auth: true }).catch(() => {});
    reload();
  }

  const applications = data?.applications ?? [];
  const fresh = applications.filter((item) => item.status === 'new').length;

  return (
    <section className="admin-panel">
      <header className="admin-panel-head">
        <div>
          <h1>Sponsor applications</h1>
          <p>{fresh ? `${fresh} new ${fresh === 1 ? 'application needs' : 'applications need'} a reply.` : 'Everything has been looked at.'}</p>
        </div>
        <button type="button" className="button button-outline" onClick={() => void downloadFile('/api/admin/sponsor-applications.csv', 'sponsor-applications.csv')}>
          <Download aria-hidden="true" />
          Export CSV
        </button>
      </header>
      {error && <p className="admin-error">{error}</p>}
      {notice && (
        <output className="admin-info">
          {notice}
        </output>
      )}
      {data && applications.length === 0 && <p className="admin-muted">No applications yet. They arrive here from the Sponsors page form.</p>}
      <ul className="admin-applications">
        {applications.map((item) => (
          <li key={item.id} className={`admin-application admin-application-${item.status}`}>
            <button type="button" className="admin-application-head" aria-expanded={openId === item.id} onClick={() => setOpenId(openId === item.id ? null : item.id)}>
              <span>
                <strong>{item.organization}</strong>
                <small>
                  {item.contactName} · {formatDateTime(item.createdAt)}
                </small>
              </span>
              <span className={`admin-pill admin-status-${item.status}`}>{STATUS_LABELS[item.status]}</span>
            </button>
            {openId === item.id && (
              <div className="admin-application-body">
                <dl>
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <a href={`mailto:${item.email}?subject=${encodeURIComponent('IEEE Sooners sponsorship')}`}>
                        <Mail aria-hidden="true" />
                        {item.email}
                      </a>
                    </dd>
                  </div>
                  {item.phone && (
                    <div>
                      <dt>Phone</dt>
                      <dd>{item.phone}</dd>
                    </div>
                  )}
                  {item.website && (
                    <div>
                      <dt>Website</dt>
                      <dd>
                        <a href={item.website} target="_blank" rel="noreferrer">
                          {item.website}
                        </a>
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>Interested in</dt>
                    <dd>{item.interests.map((value) => INTEREST_LABELS[value] ?? value).join(', ') || 'Not specified'}</dd>
                  </div>
                  <div>
                    <dt>Budget</dt>
                    <dd>{BUDGET_LABELS[item.budget] ?? (item.budget || 'Not specified')}</dd>
                  </div>
                  <div>
                    <dt>Timing</dt>
                    <dd>{item.timeline || 'Not specified'}</dd>
                  </div>
                </dl>
                {item.message && <p className="admin-application-message">{item.message}</p>}
                <form
                  className="admin-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    const notes = form.get('notes');
                    void update(item.id, { status: form.get('status') as SponsorApplication['status'], notes: typeof notes === 'string' ? notes : '' });
                  }}
                >
                  <div className="admin-row">
                    <label>
                      <span>Status</span>
                      <select name="status" defaultValue={item.status}>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    <span>Officer notes (private)</span>
                    <textarea name="notes" rows={3} defaultValue={item.notes} maxLength={8000} />
                  </label>
                  <div className="admin-row-actions">
                    <button className="button button-crimson" type="submit">
                      Save
                    </button>
                    {isOwner && (
                      <button type="button" className="admin-danger" onClick={() => remove(item.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </li>
        ))}
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
            Everyone who can sign in here. Owners manage accounts and backups; admins write posts and handle sponsor applications.
          </p>
        </div>
        {isOwner && (
          <button type="button" className="button button-crimson" onClick={() => setAdding(!adding)}>
            <UserPlus aria-hidden="true" />
            Add admin
          </button>
        )}
      </header>
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
                <option value="admin">Admin: posts and applications</option>
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
            <span>Gmail (for password resets and sponsor alerts)</span>
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
            Download a copy before handing the site to a new webmaster, and once a semester. The database file holds every post, application and admin
            account; the export is a readable JSON copy of the content. See docs/HANDOFF.md.
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
