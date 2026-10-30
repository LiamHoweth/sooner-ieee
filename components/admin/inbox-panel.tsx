'use client';

import { Archive, ArchiveRestore, Download, Mail, MailOpen, Reply } from 'lucide-react';
import { useState } from 'react';

import { api, ApiError, downloadFile } from '@/lib/api';

import { useLoad } from './admin-panels';
import { type ContactMessage, formatDateTime, MESSAGE_TOPICS, type SponsorApplication } from './types';

// One shared inbox: contact-form messages and sponsor applications, newest first.
// Messages are open until archived. Applications count as open until they are accepted or declined.

type Item = { kind: 'message'; at: string; message: ContactMessage } | { kind: 'application'; at: string; application: SponsorApplication };

type Show = 'all' | 'messages' | 'applications' | ContactMessage['topic'];

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

const replyHref = (email: string, subject: string) => `mailto:${email}?subject=${encodeURIComponent(subject)}`;

const applicationOpen = (item: SponsorApplication) => item.status === 'new' || item.status === 'contacted';

export function InboxPanel({ isOwner, onChange }: { isOwner: boolean; onChange: () => void }) {
  const messages = useLoad<{ messages: ContactMessage[]; unread: number }>('/api/admin/messages?status=all');
  const applications = useLoad<{ applications: SponsorApplication[] }>('/api/admin/sponsor-applications');
  const [view, setView] = useState<'open' | 'archived'>('open');
  const [show, setShow] = useState<Show>('all');
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'error' | 'info'; text: string } | null>(null);

  const refresh = () => {
    messages.reload();
    applications.reload();
    onChange();
  };

  async function patchMessage(id: number, change: { read?: boolean; archived?: boolean }, text?: string) {
    try {
      await api(`/api/admin/messages/${id}`, { method: 'PATCH', body: change, auth: true });
      if (text) setNotice({ tone: 'info', text });
      refresh();
    } catch (problem) {
      setNotice({ tone: 'error', text: problem instanceof ApiError ? problem.message : 'Could not save.' });
    }
  }

  async function updateApplication(id: number, change: Partial<Pick<SponsorApplication, 'status' | 'notes'>>) {
    try {
      await api(`/api/admin/sponsor-applications/${id}`, { method: 'PATCH', body: change, auth: true });
      setNotice({ tone: 'info', text: 'Saved.' });
      refresh();
    } catch (problem) {
      setNotice({ tone: 'error', text: problem instanceof ApiError ? problem.message : 'Could not save.' });
    }
  }

  async function remove(path: string, what: string) {
    if (!window.confirm(`Delete this ${what} for good?`)) return;
    try {
      await api(path, { method: 'DELETE', auth: true });
      setOpenKey(null);
      refresh();
    } catch (problem) {
      setNotice({ tone: 'error', text: problem instanceof ApiError ? problem.message : 'Could not delete.' });
    }
  }

  function toggle(item: Item, key: string) {
    const opening = openKey !== key;
    setOpenKey(opening ? key : null);
    // Opening an unread message marks it read for everyone, like a shared mailbox.
    if (opening && item.kind === 'message' && !item.message.readAt) void patchMessage(item.message.id, { read: true });
  }

  const allMessages = messages.data?.messages ?? [];
  const allApplications = applications.data?.applications ?? [];
  const items: Item[] = [
    ...allMessages
      .filter((message) => (view === 'open' ? !message.archivedAt : Boolean(message.archivedAt)))
      .filter(() => show !== 'applications')
      .filter((message) => show === 'all' || show === 'messages' || show === message.topic)
      .map((message) => ({ kind: 'message' as const, at: message.createdAt, message })),
    ...allApplications
      .filter((application) => (view === 'open' ? applicationOpen(application) : !applicationOpen(application)))
      .filter(() => show === 'all' || show === 'applications')
      .map((application) => ({ kind: 'application' as const, at: application.createdAt, application })),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  const unread = allMessages.filter((message) => !message.readAt && !message.archivedAt).length;
  const fresh = allApplications.filter((application) => application.status === 'new').length;
  const loaded = messages.data !== null && applications.data !== null;
  const summary = [
    unread ? `${unread} unread ${unread === 1 ? 'message' : 'messages'}` : '',
    fresh ? `${fresh} new sponsor ${fresh === 1 ? 'application' : 'applications'}` : '',
  ].filter(Boolean);

  return (
    <section className="admin-panel">
      <header className="admin-panel-head">
        <div>
          <h1>Inbox</h1>
          <p>
            {summary.length ? `${summary.join(' and ')}.` : 'Everything has been looked at.'} Messages from the Contact page and sponsor applications land here
            for every officer.
          </p>
        </div>
        <button type="button" className="button button-outline" onClick={() =>
            void downloadFile('/api/admin/sponsor-applications.csv', 'sponsor-applications.csv').catch((problem: unknown) =>
              setNotice({ tone: 'error', text: problem instanceof ApiError ? problem.message : 'Could not export applications.' }),
            )
          }>
          <Download aria-hidden="true" />
          Export applications (CSV)
        </button>
      </header>
      <div className="admin-inbox-filters">
        <div className="admin-tabs-inline" role="toolbar" aria-label="Open or archived">
          {(['open', 'archived'] as const).map((value) => (
            <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}>
              {value === 'open' ? 'Open' : 'Archived'}
            </button>
          ))}
        </div>
        <label className="admin-inbox-show">
          <span>Show</span>
          <select value={show} onChange={(event) => setShow(event.target.value as Show)}>
            <option value="all">Everything</option>
            <option value="messages">All messages</option>
            {MESSAGE_TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                Messages: {topic}
              </option>
            ))}
            <option value="applications">Sponsor applications</option>
          </select>
        </label>
      </div>
      {(messages.error || applications.error) && <p className="admin-error">{messages.error || applications.error}</p>}
      {notice && <output className={notice.tone === 'error' ? 'admin-error' : 'admin-info'}>{notice.text}</output>}
      {loaded && items.length === 0 && (
        <p className="admin-muted">
          {view === 'open'
            ? 'Nothing waiting. New contact messages and sponsor applications appear here.'
            : 'Nothing archived yet. Archived messages and accepted or declined applications appear here.'}
        </p>
      )}
      <ul className="admin-applications">
        {items.map((item) => {
          const key = `${item.kind}-${item.kind === 'message' ? item.message.id : item.application.id}`;
          return item.kind === 'message' ? (
            <MessageItem
              key={key}
              message={item.message}
              open={openKey === key}
              isOwner={isOwner}
              onToggle={() => toggle(item, key)}
              onPatch={(change, text) => void patchMessage(item.message.id, change, text)}
              onDelete={() => void remove(`/api/admin/messages/${item.message.id}`, 'message')}
            />
          ) : (
            <ApplicationItem
              key={key}
              item={item.application}
              open={openKey === key}
              isOwner={isOwner}
              onToggle={() => toggle(item, key)}
              onSave={(change) => void updateApplication(item.application.id, change)}
              onDelete={() => void remove(`/api/admin/sponsor-applications/${item.application.id}`, 'application')}
            />
          );
        })}
      </ul>
    </section>
  );
}

function MessageItem({
  message,
  open,
  isOwner,
  onToggle,
  onPatch,
  onDelete,
}: {
  message: ContactMessage;
  open: boolean;
  isOwner: boolean;
  onToggle: () => void;
  onPatch: (change: { read?: boolean; archived?: boolean }, text?: string) => void;
  onDelete: () => void;
}) {
  const unread = !message.readAt;
  return (
    <li className={unread && !message.archivedAt ? 'admin-application admin-application-new admin-inbox-unread' : 'admin-application'}>
      <button type="button" className="admin-application-head" aria-expanded={open} onClick={onToggle}>
        <span>
          <strong>
            {message.name}
            {message.organization ? ` · ${message.organization}` : ''}
          </strong>
          <small>{formatDateTime(message.createdAt)}</small>
        </span>
        <span className="admin-inbox-tags">
          <span className="admin-pill admin-inbox-kind">Message · {message.topic}</span>
          {unread && <span className="admin-pill admin-status-new">Unread</span>}
        </span>
      </button>
      {open && (
        <div className="admin-application-body">
          <dl>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={replyHref(message.email, `Re: ${message.topic} – IEEE Sooners`)}>
                  <Mail aria-hidden="true" />
                  {message.email}
                </a>
              </dd>
            </div>
            {message.organization && (
              <div>
                <dt>Organization</dt>
                <dd>{message.organization}</dd>
              </div>
            )}
            <div>
              <dt>Read</dt>
              <dd>{message.readAt ? `${formatDateTime(message.readAt)}${message.readBy ? ` by ${message.readBy}` : ''}` : 'Not yet'}</dd>
            </div>
            {message.archivedAt && (
              <div>
                <dt>Archived</dt>
                <dd>
                  {formatDateTime(message.archivedAt)}
                  {message.archivedBy ? ` by ${message.archivedBy}` : ''}
                </dd>
              </div>
            )}
          </dl>
          <p className="admin-application-message">{message.message}</p>
          <div className="admin-row-actions">
            <a className="button button-crimson" href={replyHref(message.email, `Re: ${message.topic} – IEEE Sooners`)}>
              <Reply aria-hidden="true" />
              Reply by email
            </a>
            {message.archivedAt ? (
              <button type="button" className="button button-outline" onClick={() => onPatch({ archived: false }, 'Moved back to Open.')}>
                <ArchiveRestore aria-hidden="true" />
                Move to Open
              </button>
            ) : (
              <button type="button" className="button button-outline" onClick={() => onPatch({ archived: true }, 'Archived.')}>
                <Archive aria-hidden="true" />
                Archive
              </button>
            )}
            <button type="button" className="admin-link-button" onClick={() => onPatch({ read: unread }, unread ? 'Marked read.' : 'Marked unread.')}>
              <MailOpen aria-hidden="true" />
              {unread ? 'Mark read' : 'Mark unread'}
            </button>
            {isOwner && (
              <button type="button" className="admin-danger" onClick={onDelete}>
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function ApplicationItem({
  item,
  open,
  isOwner,
  onToggle,
  onSave,
  onDelete,
}: {
  item: SponsorApplication;
  open: boolean;
  isOwner: boolean;
  onToggle: () => void;
  onSave: (change: Partial<Pick<SponsorApplication, 'status' | 'notes'>>) => void;
  onDelete: () => void;
}) {
  return (
    <li className={`admin-application admin-application-${item.status}`}>
      <button
        type="button"
        className="admin-application-head"
        aria-expanded={open}
        aria-label={`${item.organization}, sponsor application from ${item.contactName}, ${STATUS_LABELS[item.status]}`}
        onClick={onToggle}
      >
        <span>
          <strong>{item.organization}</strong>
          <small>
            {item.contactName} · {formatDateTime(item.createdAt)}
          </small>
        </span>
        <span className="admin-inbox-tags">
          <span className="admin-pill admin-inbox-kind">Sponsor application</span>
          <span className={`admin-pill admin-status-${item.status}`}>{STATUS_LABELS[item.status]}</span>
        </span>
      </button>
      {open && (
        <div className="admin-application-body">
          <dl>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={replyHref(item.email, 'IEEE Sooners sponsorship')}>
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
              onSave({ status: form.get('status') as SponsorApplication['status'], notes: typeof notes === 'string' ? notes : '' });
            }}
          >
            <div className="admin-row">
              <label>
                <span>Status (accepted and declined move to Archived)</span>
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
              <a className="button button-outline" href={replyHref(item.email, 'IEEE Sooners sponsorship')}>
                <Reply aria-hidden="true" />
                Reply by email
              </a>
              {isOwner && (
                <button type="button" className="admin-danger" onClick={onDelete}>
                  Delete
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </li>
  );
}
