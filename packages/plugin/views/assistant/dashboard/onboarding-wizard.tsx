import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface OnboardingWizardProps {
  onComplete: () => void;
}

/**
 * Minimal example wizard:
 *  - In a real plugin, you might guide the user to set up license keys,
 *    connect Screenpipe, configure ignored folders, etc.
 */
export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);

  const nextStep = () => setStep(step + 1);

  const finish = () => {
    onComplete();
  };

  return (
    <motion.div
      className="p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2 className="text-[--text-accent] text-xl mb-4">Welcome!</h2>

      {step === 0 && (
        <div className="mb-4">
          <p className="text-[--text-normal] mb-2">
            Thanks for installing the plugin! Let's get things set up quickly.
          </p>
          <Button
            onClick={nextStep}
            variant="default"
          >
            Next
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="mb-4">
          <p className="text-[--text-normal] mb-2">
            Would you like to enable Screenpipe-based meeting enhancements?
          </p>
          <div className="flex gap-2">
            <Button
              onClick={nextStep}
              variant="default"
            >
              Yes
            </Button>
            <Button
              onClick={nextStep}
              variant="outline"
            >
              Skip
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mb-4">
          <p className="text-[--text-normal] mb-2">
            All set! Let's finalize and start using your new workflow.
          </p>
          <Button
            onClick={finish}
            variant="default"
          >
            Finish
          </Button>
        </div>
      )}
    </motion.div>
  );
} 