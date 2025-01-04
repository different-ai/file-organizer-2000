"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import {
  updateKeysAndRedeploy,
  getDeploymentStatus,
  type DeploymentStatus,
} from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeploymentStatus as DeploymentStatusComponent } from "./_components/deployment-status";
import { ConfigurationForm } from "./_components/configuration-form";
import { WizardSteps, StepContent } from "./_components/wizard-steps";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings2, Key, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type FormValues = {
  modelName: string;
  visionModelName: string;
  openaiKey?: string;
  anthropicKey?: string;
  googleKey?: string;
  generateNewLicenseKey: boolean;
};

export default function DeploymentDashboard() {
  const [deployment, setDeployment] = useState<DeploymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeploying, setIsRedeploying] = useState(false);
  const [isGeneratingNewLicense, setIsGeneratingNewLicense] = useState(false);
  const [newLicenseKey, setNewLicenseKey] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [pendingChanges, setPendingChanges] = useState<FormValues | null>(null);
  const [pollInterval, setPollInterval] = useState<number | null>(null);

  const fetchDeploymentStatus = useCallback(async () => {
    try {
      const data = await getDeploymentStatus();
      if ("error" in data) {
        throw new Error(data.error);
      }
      setDeployment(data);

      // If deployment is in progress, poll every 5 seconds
      if (data.isDeploying && !pollInterval) {
        const interval = window.setInterval(() => {
          fetchDeploymentStatus();
        }, 5000);
        setPollInterval(interval);
      } else if (!data.isDeploying && pollInterval) {
        // Stop polling if deployment is complete
        window.clearInterval(pollInterval);
        setPollInterval(null);
      }
    } catch (error) {
      toast.error("Failed to fetch deployment status");
      if (pollInterval) {
        window.clearInterval(pollInterval);
        setPollInterval(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [pollInterval]);

  useEffect(() => {
    fetchDeploymentStatus();
    return () => {
      if (pollInterval) {
        window.clearInterval(pollInterval);
      }
    };
  }, [fetchDeploymentStatus]);

  const handleRedeploy = async () => {
    if (!pendingChanges) {
      toast.error("No changes to deploy");
      return;
    }

    setIsRedeploying(true);
    const loadingToast = toast.loading(
      "Updating configuration and deploying..."
    );

    try {
      const result = await updateKeysAndRedeploy(pendingChanges);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Show what was updated
      const updates = [];
      if (pendingChanges.modelName) updates.push("Text Model");
      if (pendingChanges.visionModelName) updates.push("Vision Model");
      if (pendingChanges.openaiKey) updates.push("OpenAI Key");
      if (pendingChanges.anthropicKey) updates.push("Anthropic Key");
      if (pendingChanges.googleKey) updates.push("Google Key");

      toast.dismiss(loadingToast);
      toast.success(
        <div className="space-y-2">
          <p className="font-medium">Configuration updated successfully</p>
          <p className="text-sm text-muted-foreground">
            Updated: {updates.join(", ")}
          </p>
          <p className="text-sm text-muted-foreground">
            Deployment started. This may take a few minutes.
          </p>
        </div>,
        { duration: 5000, icon: "✅" }
      );

      // If new license key was generated, show it in modal
      if (result.newLicenseKey) {
        setNewLicenseKey(result.newLicenseKey);
      }

      // Reset state
      setPendingChanges(null);
      setCurrentStep(0);

      // Start polling for deployment status
      await fetchDeploymentStatus();
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(
        <div className="space-y-2">
          <p className="font-medium">Failed to update and redeploy</p>
          <p className="text-sm text-destructive/80">
            {error.message || "Please try again"}
          </p>
        </div>,
        {
          duration: 5000,
          icon: "❌",
        }
      );
    } finally {
      setIsRedeploying(false);
    }
  };

  const handleConfigurationSubmit = (values: FormValues) => {
    setPendingChanges(values);
    setCurrentStep(1);
  };

  const isStepComplete = (step: number) => {
    if (step === 0) return !!pendingChanges;
    return false;
  };

  const isStepEnabled = (step: number) => {
    if (step === 0) return true;
    if (step === 1) return !!pendingChanges;
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Deployment Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your self-hosted instance configuration and deployment
        </p>
      </div>
      <DeploymentStatusComponent
        deployment={deployment}
        isRedeploying={isRedeploying || !!deployment?.isDeploying}
        onRedeploy={handleRedeploy}
      />

      {deployment?.deploymentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Deployment Error</AlertTitle>
          <AlertDescription>{deployment.deploymentError}</AlertDescription>
        </Alert>
      )}

      <WizardSteps
        currentStep={currentStep}
        onStepClick={setCurrentStep}
        isStepComplete={isStepComplete}
        isStepEnabled={isStepEnabled}
        deployment={deployment}
      />


      <StepContent step={currentStep}>
        {currentStep === 0 ? (
          <ConfigurationForm
            deployment={deployment}
            isGeneratingNewLicense={isGeneratingNewLicense}
            onGenerateLicenseChange={setIsGeneratingNewLicense}
            onSubmit={handleConfigurationSubmit}
          />
        ) : (
          <div className="space-y-8">
            {pendingChanges && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Review Your Changes</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>The following changes will be applied:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {pendingChanges.modelName && (
                      <li>Text Model: {pendingChanges.modelName}</li>
                    )}
                    {pendingChanges.visionModelName && (
                      <li>Vision Model: {pendingChanges.visionModelName}</li>
                    )}
                    {pendingChanges.openaiKey && (
                      <li>OpenAI API Key: Updated</li>
                    )}
                    {pendingChanges.anthropicKey && (
                      <li>Anthropic API Key: Updated</li>
                    )}
                    {pendingChanges.googleKey && (
                      <li>Google API Key: Updated</li>
                    )}
                    {pendingChanges.generateNewLicenseKey && (
                      <li>Generate New License Key: Yes</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(0)}>
                Back to Configuration
              </Button>
              <Button
                onClick={handleRedeploy}
                disabled={
                  isRedeploying || deployment?.isDeploying || !pendingChanges
                }
              >
                {isRedeploying || deployment?.isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isRedeploying
                      ? "Deploying..."
                      : "Deployment in Progress..."}
                  </>
                ) : (
                  "Save & Deploy"
                )}
              </Button>
            </div>
          </div>
        )}
      </StepContent>

      <Dialog
        open={!!newLicenseKey}
        onOpenChange={() => setNewLicenseKey(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New License Key Generated</DialogTitle>
            <DialogDescription>
              Copy your new license key and update it in your plugin settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">License Key</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                  {newLicenseKey}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(newLicenseKey || "");
                    toast.success("License key copied to clipboard");
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                  >
                    <path
                      d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002H5.5C4.67157 4.00002 4 4.67159 4 5.50002V12.5C4 13.3284 4.67157 14 5.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.50002C14 4.67159 13.3284 4.00002 12.5 4.00002H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50002C5 5.22388 5.22386 5.00002 5.5 5.00002H12.5C12.7761 5.00002 13 5.22388 13 5.50002V12.5C13 12.7762 12.7761 13 12.5 13H5.5C5.22386 13 5 12.7762 5 12.5V5.50002Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Make sure to update this key in your Obsidian plugin settings.
                The old key will stop working once you restart your plugin.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
