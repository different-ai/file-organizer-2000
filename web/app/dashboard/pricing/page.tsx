"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  createOneTimePaymentCheckout,
  createSubscriptionCheckout,
  createYearlySubscriptionCheckout,
} from "./actions";
import { config } from "@/srm.config";
import { CheckIcon } from "lucide-react";

export default function PlanSelectionPage() {


  const renderPricingCard = (
    planKey: string,
    product: any,
    priceKey: string,
    handlePlanSelection: (plan: string) => void
  ) => {
    const price = product.prices[priceKey];
    return (
      <Card key={planKey} className="border border-stone-300 p-6 flex flex-col">
        <h2 className="text-2xl mb-2 font-semibold">{planKey} Plan</h2>
        <p className="text-4xl font-bold mb-4">
          ${price.amount / 100}
          {price.type === "recurring" && (
            <span className="text-lg font-normal">/{price.interval}</span>
          )}
        </p>
        <ul className="mb-6 flex-grow">
          {product.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-center mb-2">
              <CheckIcon className="w-5 h-5 mr-2 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          onClick={() => handlePlanSelection(planKey)}
          className="bg-stone-800 text-stone-100 px-4 py-2 w-full hover:bg-stone-700 transition-colors"
        >
          {planKey === "Lifetime"
            ? "Get Lifetime Access"
            : `Choose ${planKey} Plan`}
        </Button>
      </Card>
    );
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-5xl mb-6 font-bold text-center">Choose Your Plan</h1>
      <p className="text-xl mb-8 text-center">
        Select the perfect plan for your needs.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {renderPricingCard("Monthly", config.products.HobbyMonthly, "monthly", createSubscriptionCheckout)}
        {renderPricingCard("Yearly", config.products.HobbyYearly, "yearly", createYearlySubscriptionCheckout)}
        {renderPricingCard("Lifetime", config.products.Lifetime, "lifetime", createOneTimePaymentCheckout)}
      </div>
    </section>
  );
}
