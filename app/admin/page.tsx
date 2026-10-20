import type { Metadata } from 'next';

import { AdminApp } from '@/components/admin/admin-app';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Officer admin',
  description: 'Sign-in area for IEEE Sooners officers.',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main id="main-content" className="admin-page">
      <AdminApp />
    </main>
  );
}
