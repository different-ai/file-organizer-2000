"use client";

import { PricingCards } from "@/components/pricing-cards";

export default function PlanSelectionPage() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-5xl mb-6 font-bold text-center">One tool to stay organized</h1>
      <p className="text-xl mb-8 text-center">
        Organize anything from meetings to handwritten notes.
      </p>
      <PricingCards />
    </section>
  );
}
