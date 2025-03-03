import { GeistSans } from "geist/font/sans";
import Link from "next/link";
import "../globals.css";
import Image from "next/image";
import { Toaster } from "@/components/ui/use-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import Providers from "../providers";
import { Metadata } from "next";
import { Star } from "lucide-react";

export const metadata: Metadata = {
  metadataBase: new URL("https://notecompanion.com"),
  title: {
    default: "Note Companion DAO - Community Owned Development",
    template: "%s | Note Companion DAO",
  },
  description:
    "Join the Note Companion DAO to help shape the future of the project, receive rewards for contributions, and participate in community governance.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://notecompanion.com/dao",
    siteName: "Note Companion DAO",
    images: ["/notecompanion.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Note Companion DAO - Community Owned Development",
    description:
      "Join the Note Companion DAO to help shape the future of the project, receive rewards for contributions, and participate in community governance.",
    images: ["/notecompanion.png"],
  },
};

export default function DAOLayout({
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
                <div className="w-full border-b border-gray-200 bg-white shadow-sm">
                  <div className="mx-auto max-w-7xl px-6 py-4">
                    <div className="flex items-center justify-between">
                      <Link
                        href="/"
                        className="flex items-center gap-2 text-2xl"
                      >
                        <Image
                          src="/notecompanion.png"
                          alt="Note Companion Logo"
                          width={30}
                          height={30}
                        />
                        <span className="font-semibold text-sm md:text-base">Note Companion DAO</span>
                      </Link>
                      <div className="flex items-center space-x-4">
                        <a
                          href="https://t.me/notecompanion"
                          className="text-sm text-primary-600 font-semibold hidden md:block"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Join Telegram
                        </a>
                        <a
                          href="https://www.daos.fun/dao/8iLdHtnZL3aLVRVseT1Rv3cytngqPPoe2hWcouJLd8Gd"
                          className="text-sm text-primary-600 font-semibold hidden md:block"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Get Tokens
                        </a>
                        <a
                          href="https://github.com/different-ai/file-organizer-2000"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 bg-[#1F2937] text-white px-3 py-1.5 rounded-full text-sm font-semibold"
                        >
                          <Star className="h-4 w-4" />
                          <span>530</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col w-full">{children}</div>

                <footer className="w-full bg-primary-50 py-12">
                  <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Note Companion DAO</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          A community-owned collective shaping the future of knowledge management
                        </p>
                        <div className="flex items-center space-x-4">
                          <a 
                            href="https://t.me/notecompanion" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.26.006.549-.1.868-.32 2.179-1.471 3.304-2.214 3.374-2.23.05-.012.12-.026.166.016.047.041.042.12.037.141-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8.154 8.154 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.093.06.183.125.27.187.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.426 1.426 0 0 0-.013-.315.337.337 0 0 0-.114-.217.526.526 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09z"/>
                            </svg>
                          </a>
                          <a 
                            href="https://x.com/notecompanion" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"/>
                            </svg>
                          </a>
                          <a 
                            href="https://github.com/different-ai/file-organizer-2000" 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                            </svg>
                          </a>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                          <li>
                            <Link href="/" className="text-gray-600 hover:text-primary-600">
                              Note Companion Home
                            </Link>
                          </li>
                          <li>
                            <a 
                              href="https://www.daos.fun/dao/8iLdHtnZL3aLVRVseT1Rv3cytngqPPoe2hWcouJLd8Gd"
                              target="_blank"
                              rel="noopener noreferrer" 
                              className="text-gray-600 hover:text-primary-600"
                            >
                              DAO Tokens
                            </a>
                          </li>
                          <li>
                            <a 
                              href="https://t.me/notecompanion"
                              target="_blank"
                              rel="noopener noreferrer" 
                              className="text-gray-600 hover:text-primary-600"
                            >
                              Community Chat
                            </a>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Legal</h3>
                        <p className="text-sm text-gray-600">
                          © 2025 Different AI Inc. All rights reserved. DAO tokens are not securities and do not represent ownership in Different AI Inc.
                        </p>
                      </div>
                    </div>
                  </div>
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