import Link from "next/link";
import { UnkeyElements } from "./keys/client";
import { Button } from "@/components/ui/button";

function DownloadIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-gray-900">
      <header className="flex items-center justify-between bg-white px-6 py-4 shadow dark:bg-gray-800">
        {/* Header content */}
      </header>
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="rounded-lg bg-white border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col items-center justify-center space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                Welcome to File Organizer 2000
              </h2>
              {process.env.ENABLE_USER_MANAGEMENT == "true" ? (
                <UnkeyElements />
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Just paste this URL in the plugin settings in Obsidian and
                  you're good to go!
                </p>
              )}
            </div>
          </div>
          <div className="rounded-lg bg-white border border-gray-200 p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col items-center justify-center space-y-4">
              <DownloadIcon className="h-12 w-12 text-gray-600 dark:text-gray-400" />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                Download File Organizer 2000
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Get the latest version of File Organizer 2000 to keep your files
                organized.
              </p>
              <Link href="https://app.fileorganizer2000.com/">
                <Button>Download</Button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Requires Obsidian to be installed.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-white px-6 py-4 shadow dark:bg-gray-800">
        <div className="mx-auto max-w-3xl text-center text-gray-500 dark:text-gray-400">
          © 2024 File Organizer 2000. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
