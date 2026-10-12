import { Metadata } from 'next';
import { BlogListingClient } from './blog-listing-client';
import { getAllPosts, getAllCategories } from '@/lib/blog';
import { BreadcrumbSchema } from '@/components/breadcrumb-schema';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Read the latest updates, tips, and insights about Note Companion',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    url: '/blog',
  },
};

export default function BlogPage() {
  const allPosts = getAllPosts();
  const allCategories = getAllCategories();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Home', url: 'https://www.notecompanion.ai' },
          { name: 'Blog', url: 'https://www.notecompanion.ai/blog' },
        ]}
      />
      <BlogListingClient initialPosts={allPosts} categories={allCategories} />
    </>
  );
}
