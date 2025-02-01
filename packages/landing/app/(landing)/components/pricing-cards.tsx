"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check } from "lucide-react";

export function PricingCards() {
  const [isYearly, setIsYearly] = useState(true);

  const plans = {
    selfHosted: {
      name: "Self-hosted",
      price: "Free",
      features: [
        "Ultimate privacy",
        "Use your own AI models",
        "Community support",
        "Source code access",
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
    },
    subscription: {
      name: "Hobby Plan",
      price: isYearly ? "$119" : "$15",
      period: isYearly ? "/year" : "/month",
      features: [
        "No external AI credits needed",
        "Seamless no-sweat setup",
        "~1000 files per month",
        "300 min audio transcription p/m",
        "30 days money-back guarantee",
      ],
      buttonText: "Start Free Trial",
      buttonVariant: "default" as const,
      highlight: true,
      trial: "7-day free trial",
    },
    lifetime: {
      name: "Lifetime Access",
      price: "from $200",
      features: [
        "Requires your own openAI api key",
        "Privacy-focused",
        "Quick guided setup",
        "Unlimited usage",
        "Lifetime updates",
        "Early access features",
        "Premium support",
        "Onboarding call with the founder (on request)",
        "30 days money-back guarantee",
      ],
      buttonText: "I'm in",
      buttonVariant: "outline" as const,
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Self-Hosted */}
      <div className="relative group">
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-neutral-400/20 via-neutral-400/10 to-neutral-400/20 group-hover:from-neutral-400/40 group-hover:via-neutral-400/25 group-hover:to-neutral-400/40 transition-all duration-300" />
        <div className="relative h-full rounded-xl bg-background/60 backdrop-blur-sm p-8 flex flex-col">
          <h3 className="text-xl font-semibold mb-2">Self-Hosted</h3>
          <div className="mb-6">
            <span className="text-3xl font-bold">Free</span>
          </div>
          <p className="text-muted-foreground mb-6">Ultimate privacy and control</p>
          <div className="space-y-4 flex-grow mb-8">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Ultimate privacy</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Use your own AI models</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Community support</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Source code access</span>
            </div>
          </div>
          <Button variant="outline" className="w-full">
            Get Started
          </Button>
        </div>
      </div>

      {/* Subscription - Most Popular */}
      <div className="relative group">
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary/60 via-primary/40 to-primary/60 group-hover:from-primary/80 group-hover:via-primary/60 group-hover:to-primary/80 transition-all duration-300" />
        <div className="relative h-full rounded-xl bg-background/60 backdrop-blur-sm p-8 flex flex-col">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm rounded-full font-medium">
            Most Popular
          </div>
          <h3 className="text-xl font-semibold mb-2">Subscription</h3>
          <div className="mb-2">
            <span className="text-3xl font-bold">$15</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">or $119/year (save ~33%)</p>
          <p className="text-muted-foreground mb-6">No setup required</p>
          <div className="space-y-4 flex-grow mb-8">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>No setup required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Managed API keys</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>~1000 files per month</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Premium support</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Regular updates</span>
            </div>
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90">
            Start Free Trial
          </Button>
        </div>
      </div>

      {/* Pay Once */}
      <div className="relative group">
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-neutral-400/20 via-neutral-400/10 to-neutral-400/20 group-hover:from-neutral-400/40 group-hover:via-neutral-400/25 group-hover:to-neutral-400/40 transition-all duration-300" />
        <div className="relative h-full rounded-xl bg-background/60 backdrop-blur-sm p-8 flex flex-col">
          <h3 className="text-xl font-semibold mb-2">Pay Once</h3>
          <div className="mb-6">
            <span className="text-3xl font-bold">$300</span>
          </div>
          <p className="text-muted-foreground mb-6">Lifetime access with full control</p>
          <div className="space-y-4 flex-grow mb-8">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>One-time payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Lifetime updates</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Multiple licenses</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Premium support</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Use your own API keys</span>
            </div>
          </div>
          <Button variant="outline" className="w-full">
            Get Lifetime Access
          </Button>
        </div>
      </div>
    </div>
  );
}
