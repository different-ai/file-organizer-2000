'use client';

import { Plus, Minus } from "lucide-react";
import { useState } from "react";

const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg">
      <button
        className="w-full px-6 py-4 flex items-center justify-between text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold">{question}</span>
        {isOpen ? (
          <Minus className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Plus className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-muted-foreground">{answer}</p>
        </div>
      )}
    </div>
  );
};

export function FaqSection() {
  return (
    <section className="w-full py-24 bg-muted/50">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
        <div className="space-y-6">
          <FaqItem
            question="How to use the plugin?"
            answer="Install the plugin from Obsidian's community plugins, configure your API key, and start using the inbox folder for automatic organization. Check our tutorials for detailed guidance."
          />
          <FaqItem
            question="Which models can I use?"
            answer="We support GPT-4, GPT-3.5-turbo, and various local models. Premium users get access to our optimized GPT-4o model for enhanced performance."
          />
          <FaqItem
            question="Is there a free version?"
            answer="Yes! You can self-host the plugin for free. We also offer a 7-day free trial for our managed service."
          />
          <FaqItem
            question="Privacy Policy & Contact"
            answer="We take privacy seriously. Your data stays local unless explicitly shared. Contact us at support@fileorganizer2000.com for any questions."
          />
        </div>
      </div>
    </section>
  );
} 