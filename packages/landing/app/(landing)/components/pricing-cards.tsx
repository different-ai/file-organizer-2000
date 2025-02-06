"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check } from "lucide-react";
import Link from 'next/link';
import { Switch } from "@/components/ui/switch";

export function PricingCards() {
  const [isYearly, setIsYearly] = useState(false);

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
      {/* Self-Hosted */}
      <div className="relative group h-full">
      <div className="absolute -inset-0.5 border border-2 border-black-500 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 group-hover:from-primary/40 group-hover:via-primary/25 group-hover:to-primary/40 transition-all duration-300" />
      <div className="relative h-full rounded-2xl bg-background/100 backdrop-blur-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-semibold mb-4">Self-Hosted</h3>
            <div className="h-[88px] flex flex-col justify-end mb-8">
              <span className="text-4xl font-bold">Free</span>
            </div>
            <div className="space-y-3 mb-8">
              {plans.selfHosted.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          <Link href="https://github.com/different-ai/file-organizer-2000" passHref>
            <Button variant="outline" className="w-full">
              Get Started
            </Button>
          </Link>
        </div>
      </div>

      {/* Subscription - Most Popular */}
      <div className="relative group h-full">
        <div className="absolute -inset-0.5 border border-2 border-black-500 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 group-hover:from-primary/40 group-hover:via-primary/25 group-hover:to-primary/40 transition-all duration-300" />
        <div className="relative h-full rounded-2xl bg-background/100 backdrop-blur-sm p-6 flex flex-col justify-between">
          <div>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">

                <Badge variant="default" className="bg-primary hover:bg-primary text-white">
                  Most Popular
                </Badge>
    
            </div>
            <h3 className="text-2xl font-semibold mb-4">Subscription</h3>
            
            {/* Switch above price section */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className={`text-sm ${!isYearly ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-primary"
              />
              <span className={`text-sm ${isYearly ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                Yearly
              </span>
            </div>

            {/* Price section matching other cards */}
            <div className="h-[88px] flex flex-col justify-end mb-8">
              <div>
                <span className="text-4xl font-bold">{isYearly ? "$119" : "$15"}</span>
                <span className="text-muted-foreground ml-1">{isYearly ? "/year" : "/month"}</span>
              </div>
              {isYearly ? (
                <p className="text-sm text-primary mt-1">Save ~33% with yearly billing</p>
              ) : (
                <p className="text-sm text-primary mt-1">First month $9 with code ANIMUS</p>
              )}
            </div>

            <div className="space-y-3 mb-8">
              {plans.subscription.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
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
      <div className="relative group h-full">
      <div className="absolute -inset-0.5 border border-2 border-black-500 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 group-hover:from-primary/40 group-hover:via-primary/25 group-hover:to-primary/40 transition-all duration-300" />
      <div className="relative h-full rounded-2xl bg-background/100 backdrop-blur-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-semibold mb-4">Lifetime Access</h3>
            <div className="h-[88px] flex flex-col justify-end mb-8">
              <span className="text-4xl font-bold">from $200</span>
            </div>
            <div className="space-y-3 mb-8">
              {plans.lifetime.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
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
