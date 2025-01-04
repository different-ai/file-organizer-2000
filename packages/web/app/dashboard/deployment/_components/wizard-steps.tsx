"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Settings2, Clock, Server, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { type DeploymentStatus } from "../actions";

type Step = {
  title: string;
  description: string;
  icon: React.ReactNode;
};


type WizardStepsProps = {
  currentStep: number;
  onStepClick: (step: number) => void;
  isStepComplete: (step: number) => boolean;
  isStepEnabled: (step: number) => boolean;
  deployment: DeploymentStatus | null;
};

export function WizardSteps({ 
  currentStep, 
  onStepClick, 
  isStepComplete,
  isStepEnabled,
  deployment,
}: WizardStepsProps) {
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-primary/10 via-primary/50 to-primary/10 -top-4" />
      
      <div className="flex items-center justify-between">
        
      </div>
    </div>
  );
}

type StepContentProps = {
  step: number;
  children: React.ReactNode;
};

export function StepContent({ step, children }: StepContentProps) {
  return (
    <div className="mt-12">
      {children}
    </div>
  );
} 