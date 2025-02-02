"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check } from "lucide-react";
import Link from 'next/link';
import { Switch } from "@/components/ui/switch";

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
      name: "Subscription",
      price: isYearly ? "$119" : "$15",
      period: isYearly ? "/year" : "/month",
      features: [
        "No external AI credits needed",
        "Seamless no-sweat setup",
        "~1000 files per month",
        "300 min audio transcription p/m",
        "Support",
        "30 days money-back guarantee",
      ],
      buttonText: "Start Free Trial",
      buttonVariant: "default" as const,
      highlight: true,
      trial: "7-day free trial",
      discount: isYearly ? "Save ~33% with yearly billing" : "First month $9 with code ANIMUS",
    },
    lifetime: {
      name: "Pay Once",
      price: " from $200",
      features: [
        "Pay-as-you-go with your own API keys",
        "Privacy-focused",
        "Unlimited usage",


        "Early access features",
        "Premium support",
        "Onboarding call with a co-founder (on request)",
        "30 days money-back guarantee",
 
      ],
      buttonText: "Get Lifetime Access",
      buttonVariant: "outline" as const,
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Self-Hosted */}
      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 group-hover:from-primary/40 group-hover:via-primary/25 group-hover:to-primary/40 transition-all duration-300" />
        <div className="relative h-full rounded-2xl bg-background/60 backdrop-blur-sm p-8 flex flex-col">
          <h3 className="text-xl font-semibold mb-2">Self-Hosted</h3>
          <div className="mb-6">
            <span className="text-3xl font-bold">Free</span>
          </div>
          {/* <p className="text-muted-foreground mb-6">Ultimate privacy and control</p> */}
          <div className="space-y-4 flex-grow mb-8">
            {plans.selfHosted.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          <Link href="https://app.fileorganizer2000.com" passHref>
            <Button variant="outline" className="w-full">
              Get Started
            </Button>
          </Link>
        </div>
      </div>

      {/* Subscription - Most Popular */}
      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 group-hover:from-primary/40 group-hover:via-primary/25 group-hover:to-primary/40 transition-all duration-300" />
        <div className="relative h-full rounded-2xl bg-background/60 backdrop-blur-sm p-8 flex flex-col">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm rounded-full font-medium">
            <span className="text-white">Most Popular</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Subscription</h3>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className={`text-sm ${!isYearly ? 'text-primary' : 'text-muted-foreground'}`}>Monthly</span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm ${isYearly ? 'text-primary' : 'text-muted-foreground'}`}>Yearly</span>
          </div>
          <div className="mb-2">
            <span className="text-3xl font-bold">{isYearly ? "$119" : "$15"}</span>
            <span className="text-muted-foreground">{isYearly ? "/year" : "/month"}</span>
          </div>
          {isYearly && (
            <p className="text-sm text-primary mb-1">{plans.subscription.discount}</p>
          )}
          {/* <p className="text-muted-foreground mb-6">No setup required</p> */}
          <div className="space-y-4 flex-grow mb-8">
            {plans.subscription.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          <Link href="https://app.fileorganizer2000.com" passHref>
            <Button className="w-full bg-primary hover:bg-primary/90 text-white">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Pay Once */}
      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 group-hover:from-primary/40 group-hover:via-primary/25 group-hover:to-primary/40 transition-all duration-300" />
        <div className="relative h-full rounded-2xl bg-background/60 backdrop-blur-sm p-8 flex flex-col">
          <h3 className="text-xl font-semibold mb-2">Lifetime Access</h3>
          <div className="mb-6">
            <span className="text-3xl font-bold">from $200</span>
          </div>
          {/* <p className="text-muted-foreground mb-6">Lifetime access with full control</p> */}
          <div className="space-y-4 flex-grow mb-8">
            {plans.lifetime.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          <Link href="https://app.fileorganizer2000.com" passHref>
            <Button variant="outline" className="w-full">
              Get Lifetime Access
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
