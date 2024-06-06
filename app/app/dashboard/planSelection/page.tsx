/**
 * v0 by Vercel.
 * @see https://v0.dev/t/3ICQmCzQBYx
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Component() {
  const [selectedPlan, setSelectedPlan] = useState("14.99");
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Choose Your Plan
        </h1>
        <div className="bg-violet-900 p-2 rounded-md text-violet-50 text-center mb-8 max-w-md mx-auto">
          <SparkleIcon className="h-5 w-5 inline-block mr-2" />
          Special offer! Save $50 on the yearly plan. Only valid for June.
        </div>
        <div className="flex justify-center space-x-4 md:space-x-8">
          <Card className="w-[350px] p-6 bg-black rounded-lg shadow-md text-white md:w-[400px] relative border border-gray-500 ">
            <div className="absolute top-0 left-0 w-full h-full rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-900 opacity-10 blur-sm" />
            <div className="space-y-4">
              <div className="text-sm uppercase tracking-wide text-gray-400 text-center">
                Cloud hosted
              </div>
              <div className="text-center">
                <span className="text-5xl font-bold">$14.99</span>
              </div>
              <div className="flex justify-center">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  monthly
                </span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>My personal Whatsapp or Telegram</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>5000 files per month</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>Seamless no-sweat setup</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>No external AI subscription needed</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>30 days money-back guarantee</span>
                </li>
              </ul>
              <div className="flex justify-center">
                <Button
                  onClick={() => setSelectedPlan("monthly")}
                  className={`flex items-center justify-center gap-2  text-white px-6 py-3 rounded-md font-semibold border border-white `}
                >
                  <span>Get Monthly Plan</span>
                </Button>
              </div>
            </div>
          </Card>
          <Card className="w-[350px] p-6 bg-black rounded-lg shadow-md text-white md:w-[400px] relative  border border-white">
            <div className="absolute top-0 left-0 w-full h-full rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-900 opacity-10 blur-sm" />
            <div className="space-y-4">
              <div className="text-sm uppercase tracking-wide text-gray-400 text-center">
                Cloud hosted
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl font-bold">$99.99</span>
                  <span className="text-lg text-gray-400 line-through">
                    $149.99
                  </span>
                </div>
              </div>
              <div className="flex justify-center">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  yearly
                </span>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>My personal Whatsapp or Telegram</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>5000 files per month</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>Seamless no-sweat setup</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>No external AI subscription needed</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckIcon className="h-5 w-5 text-green-500" />
                  <span>30 days money-back guarantee</span>
                </li>
              </ul>
              <div className="flex justify-center">
                <Button
                  onClick={() => setSelectedPlan("yearly")}
                  className={`flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-md font-semibold border border-white transition-colors hover:bg-gray-800 `}
                >
                  <span>I'm in!</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

function CheckIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SparkleIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
