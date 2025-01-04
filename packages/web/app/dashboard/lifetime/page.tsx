"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutomatedSetup } from "./automated-setup";
import { LegacySetup } from "./legacy-setup";
import { InfoIcon, BookOpenIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function LifetimeAccessPage() {
  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Lifetime Access Setup</h1>
        <p className="text-muted-foreground">
          Set up your self-hosted instance for lifetime access
        </p>
      </div>

      {/* Quick Access Card */}
      <Card className="bg-gradient-to-br from-background to-muted/30">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Already deployed your instance?
            </p>
            <p className="text-xs text-muted-foreground">
              Visit your deployment dashboard to manage models and API keys
            </p>
          </div>
          <Link href="/dashboard/deployment" className="shrink-0">
            <Button variant="outline" className="gap-2">
              Deployment Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Setup Instructions */}
      <div className="grid gap-6">
        <Card className="bg-gradient-to-br from-background to-muted/30">
          <div className="border rounded-lg">
            <div className="flex items-center gap-3 border-b p-4">
              <div className="rounded-full bg-primary/10 p-2">
                <InfoIcon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-medium">Before you start</h3>
            </div>
            <div className="p-4 space-y-4">
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
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/30">
          <div className="border rounded-lg">
            <div className="flex items-center gap-3 border-b p-4">
              <div className="rounded-full bg-primary/10 p-2">
                <BookOpenIcon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-medium">Visual Setup Guide</h3>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Follow our step-by-step visual guide for setting up your lifetime access:
              </p>
              <a
                href="https://github.com/different-ai/file-organizer-2000/blob/master/tutorials/lifetime-setup-v2.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                View the Tutorial
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="automated" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="automated">Recommended Setup</TabsTrigger>
          <TabsTrigger value="legacy">Legacy Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="automated">
          <AutomatedSetup />
        </TabsContent>

        <TabsContent value="legacy">
          <Card className="bg-gradient-to-br from-background to-muted/30">
            <div className="border rounded-lg">
              <div className="flex items-center gap-3 border-b p-4">
                <div className="rounded-full bg-orange-500/10 p-2">
                  <InfoIcon className="h-4 w-4 text-orange-500" />
                </div>
                <h3 className="font-medium">Legacy Setup</h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground">
                  Only use this method if you're experiencing issues with the
                  recommended setup. This method requires manual configuration and
                  might need additional troubleshooting.
                </p>
              </div>
            </div>
          </Card>
          <div className="mt-6">
            <LegacySetup />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
