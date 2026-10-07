import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', '/career-check', '/privacy'].map(path => ({ url: `https://www.stablefuture.uk${path}` }));
}
