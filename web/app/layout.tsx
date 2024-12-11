import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { PHProvider } from "./providers";
import dynamic from "next/dynamic";
import Logo from "@/components/ui/logo";
import { Toaster } from "react-hot-toast";

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
          <body className="">
            <PostHogPageView />
            <Toaster />
            <header className="p-4 border-b border-stone-300">
              <nav className="max-w-9xl mx-auto flex items-center space-x-6 justify-between w-full">
                <div className=" sm:block">
                  <Link href="/">
                    <Logo />
                  </Link>
                </div>
                <UserManagement />
              </nav>
            </header>
            <main className="min-h-screen text-stone-900 font-sans">
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
