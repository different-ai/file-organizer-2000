import { GeistSans } from "geist/font/sans";
import Link from "next/link";
import "./globals.css";
import Image from "next/image";
import { Toaster } from "@/components/ui/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import Providers from "./providers";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

export const metadata: Metadata = {
  metadataBase: new URL("https://notecompanion.com"),
  title: {
    default: "Note Companion - Your AI-powered Knowledge Partner",
    template: "%s | Note Companion",
  },
  description:
    "Your AI-powered assistant that turns scattered notes into actionable knowledge. Seamless meeting notes, instant organization, and the smartest AI chat for your Obsidian workflow.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://notecompanion.com",
    siteName: "Note Companion",
    images: ["/notecompanion.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Note Companion - Your AI-powered Knowledge Partner",
    description:
      "Your AI-powered assistant that turns scattered notes into actionable knowledge. Seamless meeting notes, instant organization, and the smartest AI chat for your Obsidian workflow.",
    images: ["/notecompanion.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body className="bg-background">
        <TooltipProvider>
          <Providers>
            <main className="min-h-screen flex flex-col items-center">
              <div className="flex-1 w-full flex flex-col items-center">
                <div className="w-full border-b border-border bg-background backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="mx-auto max-w-7xl px-6 py-4">
                    <div className="flex items-center justify-between">
                      <Link
                        href="/"
                        className="flex items-center gap-2 text-2xl"
                      >
                        <Image
                          src="/notecompanion.png"
                          alt="hyprqrl Logo"
                          width={30}
                          height={30}
                        />
                      </Link>
                      <div className="flex items-center space-x-4">
                        <a
                          href="https://www.youtube.com/watch?v=NQjZcL4sThs&list=PLgRcC-DFR5jdUxbSBuNeymwYTH_FSVxio"
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          tutorials
                        </a>
                
                        <a
                          href="https://github.com/different-ai/file-organizer-2000"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 bg-[#1F2937] text-white px-3 py-1.5 rounded-full text-sm font-semibold"
                        >
                          <Star className="h-4 w-4" />
                          <span>492</span>
                        </a>
                        <Link href="https://app.fileorganizer2000.com">
                          <Button variant="default" size="sm">
                            Start
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col p-5 pb-20 w-full">{children}</div>

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
