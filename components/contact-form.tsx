'use client';

import { CheckCircle2, Mail, Send } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { api, ApiError, apiConfigured } from '@/lib/api';
import { chapter } from '@/lib/chapter-content';

// Must match POST /api/messages in server/.
export const TOPICS = ['Sponsorship', 'Membership', 'Events', 'Press', 'Other'] as const;
type Topic = (typeof TOPICS)[number];

const LIMITS = { name: 120, email: 200, organization: 160, messageMin: 10, messageMax: 5000 };

type Values = { name: string; email: string; organization: string; topic: string; message: string };
type Field = keyof Values;
type Errors = Partial<Record<Field, string>>;

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; height: number }
  | { kind: 'error'; message: string }
  | { kind: 'unreachable' };

const HINTS: Partial<Record<Field, string>> = {
  email: 'Where the officers can reach you.',
  organization: 'Company, lab, or student group, if any.',
};

function validate(values: Values): Errors {
  const errors: Errors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const message = values.message.trim();
  if (!name) errors.name = 'Enter your name.';
  else if (name.length > LIMITS.name) errors.name = `Keep your name under ${LIMITS.name} characters.`;
  if (!email) errors.email = 'Enter your email address.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > LIMITS.email)
    errors.email = 'Enter an email address like name@example.com.';
  if (values.organization.trim().length > LIMITS.organization)
    errors.organization = `Keep this under ${LIMITS.organization} characters.`;
  if (!TOPICS.includes(values.topic as Topic)) errors.topic = 'Choose a topic.';
  if (message.length < LIMITS.messageMin) errors.message = `Write at least ${LIMITS.messageMin} characters.`;
  else if (message.length > LIMITS.messageMax) errors.message = `Keep it under ${LIMITS.messageMax} characters.`;
  return errors;
}

// ?topic=Sponsorship preselects a topic, so other pages can link straight here.
const noSubscribe = () => () => {};
function readTopic(): Topic | '' {
  const wanted = new URLSearchParams(window.location.search).get('topic')?.toLowerCase();
  return TOPICS.find((topic) => topic.toLowerCase() === wanted) ?? '';
}

function mailto(topic: string) {
  return `mailto:${chapter.email}?subject=${encodeURIComponent(topic ? `${topic} question` : 'Question for IEEE Sooners')}`;
}

export function ContactForm() {
  const urlTopic = useSyncExternalStore(noSubscribe, readTopic, () => '');
  const [values, setValues] = useState<Omit<Values, 'topic'> & { topic: string | null }>({
    name: '',
    email: '',
    organization: '',
    topic: null,
    message: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);

  // null until the visitor picks one, so the URL's topic can fill in after hydration.
  const current: Values = { ...values, topic: values.topic ?? urlTopic };

  // Move focus to the confirmation so screen readers announce it.
  useEffect(() => {
    if (status.kind === 'sent') doneRef.current?.focus();
  }, [status.kind]);

  function update(field: Field, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    // Re-check as they type only once a field has been flagged, so errors clear without nagging.
    if (touched[field]) setErrors((previous) => ({ ...previous, [field]: validate({ ...current, [field]: value })[field] }));
  }

  function blur(field: Field) {
    setTouched((previous) => ({ ...previous, [field]: true }));
    setErrors((previous) => ({ ...previous, [field]: validate(current)[field] }));
  }

  async function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(current);
    setErrors(found);
    setTouched({ name: true, email: true, organization: true, topic: true, message: true });
    const first = (Object.keys(found) as Field[])[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    const body = {
      name: current.name.trim(),
      email: current.email.trim(),
      ...(current.organization.trim() ? { organization: current.organization.trim() } : {}),
      topic: current.topic,
      message: current.message.trim(),
      website: trapRef.current?.value ?? '',
    };
    const height = formRef.current?.offsetHeight ?? 0;
    setStatus({ kind: 'sending' });
    try {
      await api('/api/messages', { method: 'POST', body });
      setStatus({ kind: 'sent', height });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      // 400 and 429 carry a message worth showing; anything else means the API is down.
      if (apiError && (apiError.status === 400 || apiError.status === 429)) {
        const { message } = apiError;
        const field = apiError.field as Field | undefined;
        if (field && field in values) setErrors((previous) => ({ ...previous, [field]: message }));
        setStatus({ kind: 'error', message });
      } else {
        setStatus({ kind: 'unreachable' });
      }
    }
  }

  function reset() {
    setValues({ name: '', email: '', organization: '', topic: null, message: '' });
    setErrors({});
    setTouched({});
    setStatus({ kind: 'idle' });
  }

  if (status.kind === 'sent') {
    return (
      <div className="apply-done contact-done" ref={doneRef} tabIndex={-1} style={{ minHeight: status.height || undefined }}>
        <CheckCircle2 aria-hidden="true" />
        <h3>Thank you. Your message is in.</h3>
        <p>
          It is on its way to the student officers. You can also reach them at{' '}
          <a href={`mailto:${chapter.email}`}>{chapter.email}</a>.
        </p>
        <button className="button button-outline" type="button" onClick={reset}>
          Send another message
        </button>
      </div>
    );
  }

  if (!apiConfigured) {
    return (
      <div className="empty-panel contact-fallback">
        <Mail aria-hidden="true" />
        <div>
          <h3>Email the officers directly.</h3>
          <p>
            The message form is not connected yet. Write to <a href={mailto(current.topic)}>{chapter.email}</a> to
            reach the student officers.
          </p>
        </div>
        <a className="button button-crimson" href={mailto(current.topic)}>
          Write an email
        </a>
      </div>
    );
  }

  const describedBy = (field: Field) => `contact-${field}-msg`;
  const fieldMessage = (field: Field, extra?: React.ReactNode) => (
    <span className={errors[field] ? 'contact-msg contact-msg-error' : 'contact-msg'} id={describedBy(field)}>
      <span>{errors[field] ?? HINTS[field] ?? ''}</span>
      {extra}
    </span>
  );
  const messageLength = current.message.trim().length;

  return (
    <form className="apply-form contact-form" ref={formRef} onSubmit={onSubmit} noValidate aria-busy={status.kind === 'sending'}>
      <div className="apply-grid">
        <label>
          <span>Your name</span>
          <input
            name="name"
            required
            maxLength={LIMITS.name}
            autoComplete="name"
            value={current.name}
            onChange={(event) => update('name', event.target.value)}
            onBlur={() => blur('name')}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy('name')}
          />
          {fieldMessage('name')}
        </label>
        <label>
          <span>Email</span>
          <input
            name="email"
            type="email"
            required
            maxLength={LIMITS.email}
            autoComplete="email"
            value={current.email}
            onChange={(event) => update('email', event.target.value)}
            onBlur={() => blur('email')}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy('email')}
          />
          {fieldMessage('email')}
        </label>
        <label>
          <span>
            Organization <small>(optional)</small>
          </span>
          <input
            name="organization"
            maxLength={LIMITS.organization}
            autoComplete="organization"
            value={current.organization}
            onChange={(event) => update('organization', event.target.value)}
            onBlur={() => blur('organization')}
            aria-invalid={errors.organization ? true : undefined}
            aria-describedby={describedBy('organization')}
          />
          {fieldMessage('organization')}
        </label>
        <label>
          <span>Topic</span>
          <select
            name="topic"
            required
            value={current.topic}
            onChange={(event) => update('topic', event.target.value)}
            onBlur={() => blur('topic')}
            aria-invalid={errors.topic ? true : undefined}
            aria-describedby={describedBy('topic')}
          >
            <option value="" disabled>
              Choose a topic
            </option>
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
          {fieldMessage('topic')}
        </label>
      </div>

      <label>
        <span>Message</span>
        <textarea
          name="message"
          rows={7}
          required
          minLength={LIMITS.messageMin}
          maxLength={LIMITS.messageMax}
          value={current.message}
          onChange={(event) => update('message', event.target.value)}
          onBlur={() => blur('message')}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={describedBy('message')}
        />
        {fieldMessage(
          'message',
          <span className="contact-count" aria-hidden="true">
            {messageLength.toLocaleString('en-US')} / {LIMITS.messageMax.toLocaleString('en-US')}
          </span>,
        )}
      </label>

      {/* Spam trap: hidden from people and screen readers; bots fill it in. */}
      <label className="apply-trap" aria-hidden="true">
        Website
        <input ref={trapRef} name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>

      <div className="apply-actions">
        <button className="button button-crimson" type="submit" disabled={status.kind === 'sending'}>
          <Send aria-hidden="true" />
          {status.kind === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        <p aria-live="polite" className={status.kind === 'error' || status.kind === 'unreachable' ? 'apply-error' : 'apply-note'}>
          {status.kind === 'error' ? (
            status.message
          ) : status.kind === 'unreachable' ? (
            <>
              We could not send that right now. Email <a href={mailto(current.topic)}>{chapter.email}</a> instead.
            </>
          ) : (
            'Your message goes to the student officers.'
          )}
        </p>
      </div>
    </form>
  );
}
