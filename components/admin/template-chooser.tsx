'use client';

import { ArrowLeft, Award, CalendarPlus, Camera, Megaphone } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { type TemplateId, TEMPLATES } from '@/lib/post-templates';

const ICONS: Record<TemplateId, typeof Megaphone> = {
  announcement: CalendarPlus,
  recap: Camera,
  opportunity: Award,
  update: Megaphone,
};

/** "What are you posting?" The first step of a new post. */
export function TemplateChooser({ onChoose, onBack }: { onChoose: (id: TemplateId | null) => void; onBack: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  return (
    <section className="admin-panel admin-chooser" aria-labelledby="chooser-title">
      <button type="button" className="admin-link-button" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        All news posts
      </button>
      <header className="admin-panel-head">
        <div>
          <h1 id="chooser-title" ref={heading} tabIndex={-1}>
            What are you posting?
          </h1>
          <p>Pick one and you get the right blocks to fill in. You can change anything afterwards.</p>
        </div>
      </header>
      <ul className="admin-chooser-grid">
        {TEMPLATES.map((template) => {
          const Icon = ICONS[template.id];
          return (
            <li key={template.id}>
              <button type="button" className="admin-chooser-option" onClick={() => onChoose(template.id)}>
                <Icon aria-hidden="true" />
                <strong>{template.label}</strong>
                <span>{template.description}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="admin-link-button" onClick={() => onChoose(null)}>
        Start from a blank post
      </button>
    </section>
  );
}
