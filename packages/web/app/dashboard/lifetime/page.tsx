"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutomatedSetup } from "./automated-setup";
import { LegacySetup } from "./legacy-setup";
import { InfoIcon, BookOpenIcon } from "lucide-react";

export default function LifetimeAccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Lifetime Access Setup</h1>

        <Tabs defaultValue="automated" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="automated">Recommended Setup</TabsTrigger>
            <TabsTrigger value="legacy">Legacy Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="automated">
            <div className="space-y-6 mb-8">
              <div className="rounded-lg border bg-card shadow-sm transition-all">
                <div className="flex items-center gap-3 border-b p-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <InfoIcon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold">Before you start</h3>
                </div>
                <div className="p-4">
                  <ol className="list-decimal list-inside space-y-3 text-sm">
                    <li>
                      Create a free Vercel account if you don't have one at{" "}
                      <a
                        href="https://vercel.com/signup"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        vercel.com/signup
                      </a>
                    </li>
                    <li>Go to your account settings → Tokens</li>
                    <li>
                      Create a new token with:
                      <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground">
                        <li>Scope: Select your personal account scope</li>
                        <li>Expiration: Never</li>
                      </ul>
                    </li>
                  </ol>
                </div>
              </div>

              <div className="rounded-lg border bg-card shadow-sm transition-all">
                <div className="flex items-center gap-3 border-b p-4">
                  <div className="rounded-full bg-primary/10 p-2">
                    <BookOpenIcon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold">Visual Setup Guide</h3>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Follow our step-by-step visual guide for setting up your lifetime access:
                  </p>
                  <a
                    href="https://github.com/different-ai/file-organizer-2000/blob/master/tutorials/lifetime-setup-v2.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    View the Tutorial
                  </a>
                </div>
              </div>
            </div>
            <AutomatedSetup />
          </TabsContent>

          <TabsContent value="legacy">
            <div className="rounded-lg border bg-card shadow-sm transition-all mb-6">
              <div className="flex items-center gap-3 border-b p-4">
                <div className="rounded-full bg-orange-500/10 p-2">
                  <InfoIcon className="h-4 w-4 text-orange-500" />
                </div>
                <h3 className="font-semibold">Legacy Setup</h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground">
                  Only use this method if you're experiencing issues with the
                  recommended setup. This method requires manual configuration and
                  might need additional troubleshooting.
                </p>
              </div>
            </div>
            <LegacySetup />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
