"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, FileText, Folder, Zap } from "lucide-react";
import {
  createOneTimePaymentCheckout,
  createSubscriptionCheckout,
  createYearlySubscriptionCheckout,
} from "../pricing/actions";
import { config } from "@/srm.config";
import { twMerge } from "tailwind-merge";

export default function OnboardingPage() {
  const handlePlanSelection = (planKey: string) => {
    switch (planKey) {
      case "Monthly":
        return createSubscriptionCheckout();
      case "Yearly":
        return createYearlySubscriptionCheckout();
      case "Lifetime":
        return createOneTimePaymentCheckout();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      {/* Left Column: Welcome & Features */}
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
                ></iframe>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6">Key Features</h2>
              <div className="grid gap-4">
                {[
                  {
                    icon: <FileText className="h-6 w-6" />,
                    title: "Smart File Organization",
                    description: "AI-powered sorting and categorization",
                  },
                  {
                    icon: <Zap className="h-6 w-6" />,
                    title: "Chat with your files",
                    description:
                      "Ask questions about your files and get instant answers",
                  },
                  {
                    icon: <Check className="h-6 w-6" />,
                    title: "Image digitization & Audio Transcription",
                    description:
                      "Convert your hand-written notes and audio notes to text by simply dropping them into your Obsidian vault",
                  },
                ].map((feature, index) => (
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
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Choose Your Plan</h2>
            {Object.entries(config.products)
              // Sort to put Lifetime first, then Yearly, then Monthly
              .sort(([keyA], [keyB]) => {
                const order = { Lifetime: 0, Yearly: 1, Monthly: 2 };
                const planA = keyA.replace("Hobby", "");
                const planB = keyB.replace("Hobby", "");
                return (
                  order[planA as keyof typeof order] -
                  order[planB as keyof typeof order]
                );
              })
              .map(([key, product]: [string, any]) => {
                const planKey = key.replace("Hobby", "");
                const price = product.prices[planKey.toLowerCase()];
                const isLifetime = planKey === "Lifetime";

                return (
                  <Card
                    key={key}
                    className={twMerge(
                      "p-4",
                      isLifetime &&
                        "border-primary scale-105 shadow-lg relative"
                    )}
                  >
                    {isLifetime && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                          Best Value
                        </span>
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>{planKey}</CardTitle>
                        <CardDescription className="text-2xl font-bold">
                          ${price.amount / 100}
                          {price.type === "recurring" && (
                            <span className="text-sm">/{price.interval}</span>
                          )}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {product.features.map(
                          (feature: string, index: number) => (
                            <li
                              key={index}
                              className="flex items-center text-sm"
                            >
                              <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full mt-3"
                        variant={isLifetime ? "default" : "outline"}
                        onClick={() => handlePlanSelection(planKey)}
                      >
                        {planKey === "Lifetime"
                          ? "Get Lifetime Access"
                          : `Choose ${planKey} Plan`}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
          </div>
        </div>
      </main>

      <footer className="bg-gray-100 dark:bg-gray-900 py-8 mt-16">
        <div className="container mx-auto px-4 text-center ">
          <a href="https://discord.gg/udQnCRFyus" target="_blank" className="">
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
