"use client";

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Self-Hosted',
    price: 'Free',
    description: 'Ultimate privacy and control',
    features: [
      'Ultimate privacy',
      'Use your own AI models',
      'Community support',
      'Source code access',
    ],
    cta: 'Get Started',
    href: 'https://github.com/different-ai/file-organizer-2000',
    variant: 'outline' as const,
  },
  {
    name: 'Subscription',
    price: '$15',
    period: '/month',
    yearlyPrice: '$119',
    period2: '/year',
    description: 'No setup required',
    features: [
      'No setup required',
      'Managed API keys',
      '~1000 files per month',
      'Premium support',
      'Regular updates',
    ],
    cta: 'Start Free Trial',
    href: '/dashboard/subscription/automated-setup',
    variant: 'default' as const,
  },
  {
    name: 'Pay Once',
    price: '$300',
    description: 'Lifetime access with full control',
    features: [
      'One-time payment',
      'Lifetime updates',
      'Multiple licenses',
      'Premium support',
      'Use your own API keys',
    ],
    cta: 'Get Lifetime Access',
    href: '/dashboard/lifetime/automated-setup',
    variant: 'default' as const,
    popular: true,
  },
];

export function PricingCards() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={`relative rounded-lg border bg-card p-8 shadow-sm ${
            plan.popular
              ? 'border-primary/50 shadow-md'
              : 'border-border'
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-sm text-primary-foreground">
              Most Popular
            </div>
          )}
          <div className="mb-6">
            <h3 className="text-2xl font-bold">{plan.name}</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-bold">{plan.price}</span>
              {plan.period && (
                <span className="ml-1 text-muted-foreground">{plan.period}</span>
              )}
            </div>
            {plan.yearlyPrice && (
              <div className="mt-1 text-sm text-muted-foreground">
                or {plan.yearlyPrice}{plan.period2} (save ~33%)
              </div>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {plan.description}
            </p>
          </div>
          <ul className="mb-6 space-y-4">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          <Link href={plan.href}>
            <Button variant={plan.variant} className="w-full">
              {plan.cta}
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
}
