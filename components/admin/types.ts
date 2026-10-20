export type AdminUser = {
  id: number;
  username: string;
  email: string;
  display_name: string;
  role: 'owner' | 'admin';
  created_at: string;
  last_login_at: string | null;
  disabled_at: string | null;
};

export type SponsorApplication = {
  id: number;
  organization: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  interests: string[];
  budget: string;
  timeline: string;
  message: string;
  status: 'new' | 'contacted' | 'accepted' | 'declined';
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type UploadItem = {
  id: string;
  url: string;
  original_name: string | null;
  size: number;
  width: number | null;
  height: number | null;
  created_at: string;
};

export function formatDateTime(iso: string | null) {
  if (!iso) return 'Never';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}
