import type { Metadata } from 'next';

import { PostView } from '@/components/post-view';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Post',
  description: 'A post from the IEEE Sooners officers.',
};

export default function PostPage() {
  return (
    <main id="main-content">
      <PostView />
    </main>
  );
}
