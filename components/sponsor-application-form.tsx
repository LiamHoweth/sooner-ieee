'use client';

import { CheckCircle2, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { api, ApiError, apiConfigured } from '@/lib/api';
import { chapter } from '@/lib/chapter-content';

// Levels and ways to help follow the chapter's sponsorship packet (2025-26). The
// values must match LEVELS and INTERESTS in server/src/sponsors.ts.
const LEVELS = [
  {
    value: 'crimson',
    name: 'Crimson',
    amount: '$100+',
    benefits: 'Your organization’s name and link on our website, and a thank-you on our social media.',
  },
  {
    value: 'gold',
    name: 'Gold',
    amount: '$1,000+',
    benefits: 'Everything in Crimson, plus your logo on team shirts and event banners, and access to our student resume bank.',
  },
  {
    value: 'diamond',
    name: 'Diamond',
    amount: '$2,500+',
    benefits: 'Everything in Gold, plus premier logo placement on the website, shirts and banners, and priority for future collaborations.',
  },
  {
    value: 'in-kind',
    name: 'Non-monetary',
    amount: 'Time, equipment or expertise',
    benefits: 'Workshops, equipment, software or mentorship. We recognize it at the level that matches its estimated value.',
  },
  {
    value: 'not-sure',
    name: 'Not sure yet',
    amount: '',
    benefits: 'Tell us what you have in mind and the officers will walk you through the options.',
  },
];

const INTERESTS = [
  { value: 'workshop', label: 'Host a workshop or industry event', hint: 'A hands-on session, guest lecture or networking night.' },
  { value: 'equipment', label: 'Provide equipment or resources', hint: 'Parts, tools or software licenses for projects and competitions.' },
  { value: 'mentorship', label: 'Mentor students', hint: 'Career advice, internships or a visit to your site.' },
  { value: 'recruiting', label: 'Recruit at our events', hint: 'Meet members at our events, competitions and workshops.' },
  { value: 'conference', label: 'Support our conference team', hint: 'Help send our robotics team and competitors to the IEEE Region 5 Conference.' },
  { value: 'other', label: 'Something else', hint: '' },
];

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string; field?: string };

export function SponsorApplicationForm() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const doneRef = useRef<HTMLDivElement>(null);

  // Move focus to the confirmation so screen readers announce it.
  useEffect(() => {
    if (status.kind === 'sent') doneRef.current?.focus();
  }, [status.kind]);

  async function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (name: string) => {
      const value = form.get(name);
      return typeof value === 'string' ? value : '';
    };
    const body = {
      organization: field('organization'),
      contactName: field('contactName'),
      email: field('email'),
      phone: field('phone'),
      website: field('website'),
      interests: form.getAll('interests').filter((value): value is string => typeof value === 'string'),
      budget: field('budget'),
      timeline: field('timeline'),
      message: field('message'),
      fax: field('fax'),
    };
    setStatus({ kind: 'sending' });
    try {
      await api('/api/sponsor-applications', { method: 'POST', body });
      setStatus({ kind: 'sent' });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      setStatus({ kind: 'error', message: apiError?.message ?? 'Something went wrong.', field: apiError?.field });
    }
  }

  if (status.kind === 'sent') {
    return (
      <div className="apply-done" ref={doneRef} tabIndex={-1}>
        <CheckCircle2 aria-hidden="true" />
        <h3>Thank you. Your application is in.</h3>
        <p>
          The officers will reply by email, usually within a week. Questions in the meantime go to{' '}
          <a href={`mailto:${chapter.email}`}>{chapter.email}</a>.
        </p>
      </div>
    );
  }

  if (!apiConfigured) {
    return (
      <div className="empty-panel">
        <div>
          <h3>Applications open soon.</h3>
          <p>
            Until then, email <a href={`mailto:${chapter.email}`}>{chapter.email}</a> and the officers will follow up.
          </p>
        </div>
      </div>
    );
  }

  const invalid = (field: string) => (status.kind === 'error' && status.field === field ? true : undefined);

  return (
    <form className="apply-form" onSubmit={onSubmit} noValidate={false}>
      <div className="apply-grid">
        <label>
          <span>Organization</span>
          <input name="organization" required maxLength={160} autoComplete="organization" aria-invalid={invalid('organization')} />
        </label>
        <label>
          <span>Your name</span>
          <input name="contactName" required maxLength={120} autoComplete="name" aria-invalid={invalid('contactName')} />
        </label>
        <label>
          <span>Work email</span>
          <input name="email" type="email" required maxLength={200} autoComplete="email" aria-invalid={invalid('email')} />
        </label>
        <label>
          <span>
            Phone <small>(optional)</small>
          </span>
          <input name="phone" type="tel" maxLength={40} autoComplete="tel" />
        </label>
        <label>
          <span>
            Website <small>(optional)</small>
          </span>
          <input name="website" type="url" maxLength={300} placeholder="https://" autoComplete="url" aria-invalid={invalid('website')} />
        </label>
      </div>

      {/* Sent as `budget`, the API's name for the sponsorship level. */}
      <fieldset className="apply-levels">
        <legend>Sponsorship level</legend>
        {LEVELS.map((level, index) => (
          <label key={level.value}>
            <input type="radio" name="budget" value={level.value} required={index === 0} />
            <span className="apply-level-name">
              {level.name}
              {level.amount && <span className="apply-level-amount">{level.amount}</span>}
            </span>
            <span className="apply-level-benefits">{level.benefits}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="apply-interests">
        <legend>
          How would you like to get involved? <small>(optional, pick any)</small>
        </legend>
        {INTERESTS.map((interest) => (
          <label key={interest.value}>
            <input type="checkbox" name="interests" value={interest.value} />
            <span>
              {interest.label}
              {interest.hint && <small className="apply-interest-hint">{interest.hint}</small>}
            </span>
          </label>
        ))}
      </fieldset>

      <label>
        <span>
          Timing <small>(optional)</small>
        </span>
        <input name="timeline" maxLength={160} placeholder="For example: a tech talk in February" />
      </label>
      <label>
        <span>
          Anything else? <small>(optional)</small>
        </span>
        <textarea name="message" rows={5} maxLength={4000} />
      </label>

      {/* Spam trap: hidden from people and screen readers. */}
      <label className="apply-trap" aria-hidden="true">
        Fax
        <input name="fax" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="apply-actions">
        <button className="button button-crimson" type="submit" disabled={status.kind === 'sending'}>
          <Send aria-hidden="true" />
          {status.kind === 'sending' ? 'Sending…' : 'Send application'}
        </button>
        <p aria-live="polite" className={status.kind === 'error' ? 'apply-error' : 'apply-note'}>
          {status.kind === 'error' ? status.message : 'We only use your details to reply about sponsorship.'}
        </p>
      </div>
    </form>
  );
}
