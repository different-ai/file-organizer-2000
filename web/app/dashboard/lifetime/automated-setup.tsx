"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { setupProject, getVercelDeployment } from "./action";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ChevronRight, ExternalLink, Clock, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const formSchema = z.object({
  vercelToken: z.string().min(1, "Vercel token is required").trim(),
  openaiKey: z
    .string()
    .min(1, "OpenAI API key is required")
    .trim()
    // must start with sk- simple
    .regex(/^sk-/, "OpenAI API key must start with 'sk-'"),
});

type FormValues = z.infer<typeof formSchema>;

export function AutomatedSetup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [deploymentStatus, setDeploymentStatus] = useState({
    isDeploying: false,
    error: null,
    deploymentUrl: null,
    projectUrl: null,
    licenseKey: null as string | null,
  });
  const [existingDeployment, setExistingDeployment] = useState<{
    deploymentUrl: string;
    projectId: string;
    projectUrl: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeploying, setIsRedeploying] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vercelToken: "",
      openaiKey: "",
    },
  });

  useEffect(() => {
    checkExistingDeployment();
  }, []);

  const checkExistingDeployment = async () => {
    try {
      const deployment = await getVercelDeployment();
      setExistingDeployment(deployment);
    } catch (error) {
      console.error("Failed to fetch deployment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeploy = async () => {
    if (!existingDeployment?.projectId) return;
    
    setIsRedeploying(true);
    try {
      const response = await fetch("/api/redeploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to trigger redeployment");
      }
      
      toast.custom((t) => (
        <div className="bg-background border border-border rounded-lg p-4 shadow-lg">
          <h3 className="font-medium mb-1">Redeployment triggered</h3>
          <p className="text-sm text-muted-foreground">
            Your instance is being updated. This may take a few minutes.
          </p>
        </div>
      ), { duration: 5000 });
    } catch (error) {
      console.error("Redeployment failed:", error);
      toast.custom((t) => (
        <div className="bg-destructive/5 border-destructive/20 border rounded-lg p-4 shadow-lg">
          <h3 className="font-medium text-destructive mb-1">Redeployment failed</h3>
          <p className="text-sm text-destructive/80">
            Please try again later or contact support.
          </p>
        </div>
      ), { duration: 5000 });
    } finally {
      setIsRedeploying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (existingDeployment) {
    return (
      <div className="space-y-6">
        <Card className="border-none bg-gradient-to-b from-background to-muted/50 rounded-md p-4">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2">
              Deployment Status
              <div className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-4">
            {/* Project URL */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Project URL</h3>
              <div className="flex items-center gap-2">
                <code className="px-2 py-1 bg-muted rounded text-sm break-all">
                  {existingDeployment.projectUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(existingDeployment.projectUrl, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Actions</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRedeploy}
                  disabled={isRedeploying}
                  className="gap-2"
                >
                  {isRedeploying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {isRedeploying ? "Redeploying..." : "Redeploy Instance"}
                </Button>
              </div>
            </div>

            {/* Status Information */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-4">
              <div className="flex items-start gap-3 text-muted-foreground">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Automatic Updates</p>
                  <p className="text-sm">
                    Your instance is automatically updated daily at midnight UTC. You can also
                    manually trigger an update using the redeploy button above.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plugin Setup Reminder */}
        <Card className="rounded-md p-4">
          <CardHeader className="p-4">
            <CardTitle>Plugin Setup</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Make sure your Obsidian plugin is configured with these settings:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Self-Hosting URL</span>
                  <code className="px-2 py-1 bg-muted rounded text-xs">
                    {existingDeployment.projectUrl}
                  </code>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full"
              >
                <a href="obsidian://show-plugin?id=fileorganizer2000">
                  Open Plugin Settings
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDeploy = async (values: FormValues) => {
    setDeploymentStatus({
      isDeploying: true,
      error: null,
      deploymentUrl: null,
      licenseKey: null,
      projectUrl: null,
    });

    try {
      const result = await setupProject(
        values.vercelToken.trim(),
        values.openaiKey.trim()
      );
      setDeploymentStatus({
        isDeploying: false,
        error: null,
        deploymentUrl: result.deploymentUrl,
        licenseKey: result.licenseKey,
        projectUrl: result.projectUrl,
      });
      setCurrentStep(3); // Move to final step after successful deployment
    } catch (error: any) {
      setDeploymentStatus({
        isDeploying: false,
        error: error.message,
        deploymentUrl: null,
        licenseKey: null,
        projectUrl: null,
      });
    }
  };
  console.log(form.formState, "form state");

  const TroubleshootingSection = () => (
    <div className="mt-8 border-t pt-6">
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer">
          <h4 className="font-medium text-muted-foreground">
            Troubleshooting Guide
          </h4>
          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
        </summary>
        <div className="mt-4 space-y-4 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h5 className="font-medium">Common Issues:</h5>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <span className="font-medium">Deployment Stuck:</span> If your deployment seems stuck, check the build logs on Vercel by clicking on the deployment URL and navigating to the "Runtime Logs" tab.
              </li>
              <li>
                <span className="font-medium">Invalid Project URL:</span> Make sure you're using the production URL from your Vercel deployment (usually ends with .vercel.app unless you've configured a custom domain).
              </li>
              <li>
                <span className="font-medium">License Key Not Working:</span> Verify that you've copied the entire license key without any extra spaces.
              </li>
            </ul>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg mt-4">
            <p>
              If you continue experiencing issues, please email{" "}
              <a 
                href="mailto:alex@fileorganizer2000.com"
                className="text-primary hover:underline"
              >
                alex@fileorganizer2000.com
              </a>{" "}
              with:
            </p>
            <ul className="list-disc list-inside mt-2 ml-2">
              <li>Your deployment URL</li>
              <li>Screenshots of any error messages</li>
              <li>Steps you've tried so far</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  );

  const steps = [
    {
      number: 1,
      title: "Get Your Vercel Token",
      isCompleted: currentStep > 1,
      isCurrent: currentStep === 1,
      content: (
        <div className="space-y-4">
          <ol className="list-decimal list-inside space-y-3 text-sm pl-4">
            <li>
              Create a free Vercel account if you don't have one at{" "}
              <a
                href="https://vercel.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                vercel.com/signup
              </a>
            </li>
            <li>Go to your account settings → Tokens</li>
            <li>
              Create a new token with:
              <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground">
                <li>Scope: Select your personal account scope</li>
                <li>Expiration: Never</li>
              </ul>
            </li>
          </ol>
          <Button onClick={() => setCurrentStep(2)} className="mt-4">
            I have my token <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
    },
    {
      number: 2,
      title: "Deploy Your Instance",
      isCompleted: currentStep > 2,
      isCurrent: currentStep === 2,
      content: (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleDeploy)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="vercelToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vercel Token</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your Vercel token"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="openaiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OpenAI API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="sk-..." {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    Get your API key from{" "}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      OpenAI Dashboard
                    </a>
                  </p>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={deploymentStatus.isDeploying || !form.formState.isValid}
              className="w-full"
            >
              {deploymentStatus.isDeploying
                ? "Deploying..."
                : "Deploy to Vercel"}
            </Button>
          </form>
        </Form>
      ),
    },
    {
      number: 3,
      title: "Configure Plugin",
      isCompleted: false,
      isCurrent: currentStep === 3,
      content: (
        <div className="space-y-6">
          {deploymentStatus.deploymentUrl && (
            <Card className="border bg-muted/50 p-4 rounded-md">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Deployment Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-muted-foreground">
                    1. Click the link below to check your deployment status:
                  </p>
                  <a 
                    href={deploymentStatus.deploymentUrl.startsWith('http') ? deploymentStatus.deploymentUrl : `https://${deploymentStatus.deploymentUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Deployment Status
                  </a>
                </div>
                <div className="rounded-lg bg-primary/10 p-4">
                  <p className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Wait for the deployment to complete (usually takes 2-3 minutes)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {deploymentStatus.licenseKey && (
            <Card className="border bg-muted/50 p-4 rounded-md">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Your License Key</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-muted rounded text-sm break-all">
                    {deploymentStatus.licenseKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        deploymentStatus.licenseKey!
                      );
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            <h4 className="font-medium">Next Steps:</h4>
            <ol className="list-decimal list-inside space-y-4 text-sm">
              <li className="text-muted-foreground">
                After deployment is complete, copy your project URL from the Vercel dashboard
                {deploymentStatus.projectUrl && (
                  <div className="mt-2">
                    <code className="px-2 py-1 bg-muted rounded text-sm break-all">
                      {deploymentStatus.projectUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => navigator.clipboard.writeText(deploymentStatus.projectUrl!)}
                    >
                      Copy
                    </Button>
                  </div>
                )}
              </li>
              <li>
                Install the Obsidian plugin:
                <div className="mt-2">
                  <a href="obsidian://show-plugin?id=fileorganizer2000">
                    <Button variant="outline" size="sm">
                      Download Plugin
                    </Button>
                  </a>
                </div>
              </li>
              <li>Open Obsidian settings and go to File Organizer settings</li>
              <li>Click on Advanced and enable "Self-Hosting" toggle</li>
              <li>Enter your project URL and license key in the settings</li>
              <li>Click "Activate" to complete the setup</li>
            </ol>
          </div>

          <TroubleshootingSection />
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto">
      <Toaster position="top-right" />
      <Card className="border-none bg-gradient-to-b from-background to-muted/50 shadow-md p-4 rounded-md">
        <CardHeader className="pb-8 text-center p-4">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
            Self-Hosting Setup
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Follow these steps to set up your own instance
          </p>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connection line between steps */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute left-[27px] top-[44px] w-[2px] h-[calc(100%_-_32px)]
                      ${
                        step.isCompleted
                          ? "bg-gradient-to-b from-primary to-primary/50"
                          : "bg-border"
                      }
                    `}
                  />
                )}

                <div className="relative">
                  <div
                    className={`
                    flex items-center gap-6
                    ${
                      step.isCompleted
                        ? "text-primary"
                        : step.isCurrent
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }
                  `}
                  >
                    <div
                      className={`
                      flex items-center justify-center w-14 h-14 rounded-full
                      transition-all duration-300 relative z-10
                      ${
                        step.isCompleted
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : step.isCurrent
                          ? "bg-background border-2 border-primary shadow-lg"
                          : "bg-muted border border-border"
                      }
                    `}
                    >
                      {step.isCompleted ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <span className="text-lg font-semibold">
                          {step.number}
                        </span>
                      )}
                    </div>
                    <h3
                      className={`font-semibold transition-all duration-200
                      ${
                        step.isCompleted || step.isCurrent
                          ? "text-xl"
                          : "text-base opacity-80"
                      }
                    `}
                    >
                      {step.title}
                    </h3>
                  </div>

                  {step.isCurrent && (
                    <div className="mt-6 ml-20">
                      <div className="bg-muted/50 rounded-lg p-6 border border-border/50 backdrop-blur-sm">
                        {step.content}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error message */}
          {deploymentStatus.error && (
            <div className="mt-8">
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-destructive/10 p-1">
                    <svg
                      className="h-5 w-5 text-destructive"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-destructive">
                      Deployment Error
                    </p>
                    <p className="mt-1 text-sm text-destructive/80">
                      {deploymentStatus.error}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
