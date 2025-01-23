import { GeistSans } from 'geist/font/sans';
import Link from 'next/link';
import './globals.css';
import Image from 'next/image';
import { Toaster } from '@/components/ui/use-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import Providers from './providers';
import { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://hyprsqrl.com'),
  title: {
    default: 'HyprSqrl - AI Agents for your Business Finance Automation',
    template: '%s | HyprSqrl',
  },
  description: 'AI agents that automate your business tasks and workflows.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://hyprsqrl.com',
    siteName: 'HyprSqrl',
    images: ['/og-new-hyprsqrlcrypto.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HyprSqrl - AI Agents for your Business Finance Automation',
    description: 'AI agents that automate your business tasks and workflows.',
    images: ['/og-new-hyprsqrlcrypto.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body className="">
        <TooltipProvider>
          <Providers>
            <main className="min-h-screen flex flex-col items-center">
              <div className="flex-1 w-full flex flex-col items-center">
                <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
                  <div className="w-full flex justify-between items-center p-3 px-5 text-sm">
                    <div className="flex gap-5 items-center font-semibold">
                      <Link
                        href="/"
                        className="flex items-center gap-2 text-2xl"
                      >
                        <Image
                          src="/hsql.png"
                          alt="hyprqrl Logo"
                          width={30}
                          height={30}
                        />
                      </Link>
                    </div>
                  </div>
                </nav>
                <div className="flex flex-col p-5 pb-20 w-full">
                  {children}
                </div>

                <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8">
                  <p>Different AI Inc - Privacy-first AI solutions</p>
                </footer>
              </div>
            </main>
            <Toaster />
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  );
}
