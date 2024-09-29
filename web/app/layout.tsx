import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { PHProvider } from "./providers";
import dynamic from "next/dynamic";
import Logo from "@/components/ui/logo";

const PostHogPageView = dynamic(() => import("./posthog-page-view"), {
  ssr: false,
});

import "./globals.css";
import Link from "next/link";
import UserManagement from "@/components/user-management";

export const metadata: Metadata = {
  title: "File Organizer 2000 - Dashboard",
  description: "Manage your account",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return process.env.ENABLE_USER_MANAGEMENT == "true" ? (
    <ClerkProvider>
      <html lang="en">
        <PHProvider>
          <body className="bg-stone-100">
            <PostHogPageView />
            <header className="p-4 border-b border-stone-300">
              <nav className="max-w-6xl mx-auto flex items-center space-x-6 justify-between w-full">
                <Link href="/">
                  <Logo />
                </Link>
                <UserManagement />
              </nav>
            </header>
            <main className="min-h-screen bg-stone-100 text-stone-900 font-sans">
              {children}
            </main>
          </body>
        </PHProvider>
      </html>
    </ClerkProvider>
  ) : (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
