"use client";

import { FileText, Zap, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PricingCards } from "@/components/pricing-cards";

const FEATURES = [
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Smart File Organization",
    description: "AI-powered sorting and categorization",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Chat with your files",
    description: "Ask questions about your files and get instant answers",
  },
  {
    icon: <Check className="h-6 w-6" />,
    title: "Image digitization & Audio Transcription",
    description:
      "Convert your hand-written notes and audio notes to text by simply dropping them into your Obsidian vault",
  },
];

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <section className="mb-12">
              <h1 className="text-4xl font-bold mb-4">
                Welcome to File Organizer 2000
              </h1>
              <p className="text-xl mb-8">
                Powerful AI features to organize and enhance your Obsidian
                experience.
              </p>
              <div className="aspect-video mb-8">
                <iframe
                  className="w-full h-full rounded-lg shadow-lg"
                  src="https://youtube.com/embed/videoseries?list=PLgRcC-DFR5jcwwg0Dr3gNZrkZxkztraKE&controls=1&rel=0&modestbranding=1"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6">Key Features</h2>
              <div className="grid gap-4">
                {FEATURES.map((feature, index) => (
                  <Card key={index}>
                    <CardContent className="flex items-start p-4 border border-stone-300">
                      <div className="mr-4 text-primary">{feature.icon}</div>
                      <div>
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Pricing */}
          <PricingCards />
        </div>
      </main>

      <footer className="bg-gray-100 dark:bg-gray-900 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <a href="https://discord.gg/udQnCRFyus" target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Join our discord</Button>
          </a>
          <p className="mt-4 text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Different AI Inc. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
