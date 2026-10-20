import { z } from 'zod';

import { type Db, now } from './db.js';

export const INTERESTS = ['speaker', 'workshop', 'projects', 'travel', 'events', 'recruiting', 'other'] as const;
export const BUDGETS = ['under-500', '500-1000', '1000-5000', '5000-plus', 'in-kind', 'not-sure'] as const;
export const STATUSES = ['new', 'contacted', 'accepted', 'declined'] as const;

export const applicationSchema = z.object({
  organization: z.string().trim().min(1, 'Add your organization').max(160),
  contactName: z.string().trim().min(1, 'Add a contact name').max(120),
  email: z.string().trim().toLowerCase().email('Use a valid email').max(200),
  phone: z.string().trim().max(40).default(''),
  website: z
    .string()
    .trim()
    .max(300)
    .refine((value) => value === '' || /^https?:\/\//i.test(value), 'Start the website with https://')
    .default(''),
  interests: z.array(z.enum(INTERESTS)).max(INTERESTS.length).default([]),
  budget: z.enum(BUDGETS).or(z.literal('')).default(''),
  timeline: z.string().trim().max(160).default(''),
  message: z.string().trim().max(4000).default(''),
  // Honeypot: real people never see or fill this field.
  fax: z.string().max(200).optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export function saveApplication(db: Db, input: ApplicationInput) {
  const stamp = now();
  const result = db
    .prepare(
      `INSERT INTO sponsor_applications (organization, contact_name, email, phone, website, interests, budget, timeline, message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.organization,
      input.contactName,
      input.email,
      input.phone,
      input.website,
      JSON.stringify(input.interests),
      input.budget,
      input.timeline,
      input.message,
      stamp,
      stamp,
    );
  return Number(result.lastInsertRowid);
}

type ApplicationRow = {
  id: number;
  organization: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  interests: string;
  budget: string;
  timeline: string;
  message: string;
  status: (typeof STATUSES)[number];
  notes: string;
  created_at: string;
  updated_at: string;
};

export function serializeApplication(row: ApplicationRow) {
  return {
    id: row.id,
    organization: row.organization,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    website: row.website,
    interests: JSON.parse(row.interests) as string[],
    budget: row.budget,
    timeline: row.timeline,
    message: row.message,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listApplications(db: Db) {
  return (db.prepare('SELECT * FROM sponsor_applications ORDER BY created_at DESC').all() as ApplicationRow[]).map(
    serializeApplication,
  );
}

export const applicationUpdateSchema = z.object({
  status: z.enum(STATUSES).optional(),
  notes: z.string().max(8000).optional(),
});

export function updateApplication(db: Db, id: number, update: z.infer<typeof applicationUpdateSchema>) {
  const row = db.prepare('SELECT * FROM sponsor_applications WHERE id = ?').get(id) as ApplicationRow | undefined;
  if (!row) return null;
  db.prepare('UPDATE sponsor_applications SET status = ?, notes = ?, updated_at = ? WHERE id = ?').run(
    update.status ?? row.status,
    update.notes ?? row.notes,
    now(),
    id,
  );
  return serializeApplication(db.prepare('SELECT * FROM sponsor_applications WHERE id = ?').get(id) as ApplicationRow);
}

export function deleteApplication(db: Db, id: number) {
  return db.prepare('DELETE FROM sponsor_applications WHERE id = ?').run(id).changes > 0;
}

function csvCell(value: string) {
  // Prefix formula-leading characters so spreadsheets never execute submitted text.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function applicationsCsv(db: Db) {
  const rows = listApplications(db);
  const header = ['Submitted', 'Status', 'Organization', 'Contact', 'Email', 'Phone', 'Website', 'Interests', 'Budget', 'Timeline', 'Message', 'Notes'];
  const lines = rows.map((row) =>
    [
      row.createdAt,
      row.status,
      row.organization,
      row.contactName,
      row.email,
      row.phone,
      row.website,
      row.interests.join('; '),
      row.budget,
      row.timeline,
      row.message,
      row.notes,
    ]
      .map((cell) => csvCell(String(cell)))
      .join(','),
  );
  return [header.map(csvCell).join(','), ...lines].join('\r\n');
}
