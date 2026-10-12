import { getSiteBaseUrl } from './site-url';

describe('getSiteBaseUrl', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalVercelUrl = process.env.VERCEL_URL;

  afterEach(() => {
    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }
    if (originalVercelUrl === undefined) {
      delete process.env.VERCEL_URL;
    } else {
      process.env.VERCEL_URL = originalVercelUrl;
    }
  });

  it('keeps www and strips the trailing slash', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.notecompanion.ai/';
    expect(getSiteBaseUrl()).toBe('https://www.notecompanion.ai');
  });

  it('normalizes the apex host to www', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://notecompanion.ai';
    expect(getSiteBaseUrl()).toBe('https://www.notecompanion.ai');
  });

  it('defaults to www when nothing is configured', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
    expect(getSiteBaseUrl()).toBe('https://www.notecompanion.ai');
  });
});
