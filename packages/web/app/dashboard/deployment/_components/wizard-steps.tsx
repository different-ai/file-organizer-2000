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

const steps: Step[] = [
  {
    title: "Configure",
    description: "Set up your models and API keys",
    icon: <Settings2 className="h-4 w-4" />,
  },
  {
    title: "Review & Deploy",
    description: "Review changes and deploy",
    icon: <Server className="h-4 w-4" />,
  },
];

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
    <div className="space-y-8">
      {/* Info Dashboard */}
      <Card className="bg-gradient-to-br from-background to-muted/30">
        <div className="grid md:grid-cols-3 border rounded-lg p-4">
          {/* Current Configuration */}
          <div className="space-y-2 border-r border-background-modifier-border pr-3" >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings2 className="h-4 w-4" />
              <span>Current Configuration</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Text Model</span>
                <Badge variant="outline" className="font-mono text-xs font-medium text-muted-foreground">
                  {deployment?.modelName || 'Not set'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Vision Model</span>
                <Badge variant="outline" className="font-mono text-xs font-medium text-muted-foreground">
                  {deployment?.visionModelName || 'Not set'}
                </Badge>
              </div>
            </div>
          </div>

          {/* API Keys Status */}
          <div className="space-y-2 border-r border-background-modifier-border pr-3 pl-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Key className="h-4 w-4" />
              <span>API Keys</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">OpenAI</span>
                <Badge variant={deployment?.openaiKeyPresent ? "success" : "secondary"} className="text-xs">
                  {deployment?.openaiKeyPresent ? "Configured" : "Not Set"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Anthropic</span>
                <Badge variant={deployment?.anthropicKeyPresent ? "success" : "secondary"} className="text-xs">
                  {deployment?.anthropicKeyPresent ? "Configured" : "Not Set"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Google</span>
                <Badge variant={deployment?.googleKeyPresent ? "success" : "secondary"} className="text-xs">
                  {deployment?.googleKeyPresent ? "Configured" : "Not Set"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Deployment Status */}
          <div className="space-y-2 pl-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Latest Deployment</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge 
                  variant={deployment?.isDeploying ? "secondary" : deployment?.deploymentError ? "destructive" : "success"}
                  className={cn(
                    "text-xs",
                    deployment?.isDeploying && "animate-pulse"
                  )}
                >
                  {deployment?.isDeploying ? "Deploying" : deployment?.deploymentError ? "Error" : "Ready"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Last Updated</span>
                <span className="text-xs text-muted-foreground">
                  {deployment?.lastDeployment 
                    ? `${new Date(deployment.lastDeployment).toLocaleDateString()} ${new Date(deployment.lastDeployment).toLocaleTimeString()}`
                    : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Wizard Steps */}
      <div className="relative">
        {/* Progress bar */}
        <div 
          className="absolute top-[22px] left-0 h-1 bg-muted/30 w-full -z-10 rounded-full overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="h-full bg-gradient-to-r from-primary/40 to-primary transition-all duration-500 ease-in-out rounded-full"
            style={{
              width: currentStep === 0 ? "0%" : currentStep === 1 ? "100%" : "0%",
            }}
          />
        </div>

        {/* Steps */}
        <nav aria-label="Progress" className="px-8">
          <ol role="list" className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep === index;
              const isComplete = isStepComplete(index);
              const isEnabled = isStepEnabled(index);

              return (
                <li key={step.title} className="relative flex-1">
                  <div className="flex flex-col items-center group">
                    {/* Step button */}
                    <Button
                      variant="ghost"
                      className={cn(
                        "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-background transition-all duration-300",
                        "shadow-sm hover:shadow-md",
                        "hover:scale-105 active:scale-95",
                        isActive && "border-primary ring-2 ring-primary/20",
                        isComplete && "border-primary bg-primary/10",
                        !isActive && !isComplete && "border-muted hover:border-primary/50",
                        !isEnabled && "opacity-50 cursor-not-allowed hover:scale-100",
                      )}
                      onClick={() => isEnabled && onStepClick(index)}
                      disabled={!isEnabled}
                    >
                      <span className="flex items-center justify-center">
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <span className={cn(
                            "flex items-center justify-center",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}>
                            {step.icon}
                          </span>
                        )}
                      </span>
                    </Button>

                    {/* Step content */}
                    <div className="mt-4 flex flex-col items-center">
                      <span className={cn(
                        "text-sm font-medium transition-colors duration-200",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>
                        {step.title}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground text-center max-w-[140px] transition-colors duration-200">
                        {step.description}
                      </span>
                    </div>
                  </div>

                  {/* Connector line */}
                  {index !== steps.length - 1 && (
                    <div className="absolute top-[22px] left-1/2 w-full h-0.5" aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
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