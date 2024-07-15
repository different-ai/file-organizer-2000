import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { PHProvider } from "./providers";
import dynamic from "next/dynamic";

const PostHogPageView = dynamic(() => import("./PostHogPageView"), {
  ssr: false,
});

import "./globals.css";

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
          <body>
            <PostHogPageView />
            {children}
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
