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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  ChevronRight, 
  ExternalLink, 
  Clock, 
  Loader2, 
  RefreshCw, 
  AlertCircle,
  Globe,
  Key,
  Lock
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  vercelToken: z.string().min(1, "Vercel token is required").trim(),
  openaiKey: z
    .string()
    .min(1, "OpenAI API key is required")
    .trim()
    .regex(/^sk-/, "OpenAI API key must start with 'sk-'"),
});

type FormValues = z.infer<typeof formSchema>;

interface DeploymentError extends Error {
  message: string;
}

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
      <Card className="bg-gradient-to-br from-background to-muted/30">
        <div className="grid gap-6 border rounded-lg p-4">
          {/* Project URL */}
          <div className="flex items-center gap-4">
            <code className="flex-1 px-4 py-2 bg-muted/50 rounded-md text-sm font-mono break-all">
              {existingDeployment.projectUrl}
            </code>
            <Button 
              variant="outline" 
              onClick={() => window.open(existingDeployment.projectUrl, '_blank')}
              className="h-9 gap-2 bg-background/50 backdrop-blur-sm border-muted-foreground/20"
            >
              <Globe className="h-4 w-4" />
              Visit Site
              <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Deployment Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span>Deployment</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge 
                    variant="default"
                    className={cn(
                      "text-xs bg-primary/15 text-primary hover:bg-primary/20"
                    )}
                  >
                    Active
                  </Badge>
                </div>
                {!isRedeploying && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">Action</span>
                    <Button
                      onClick={handleRedeploy}
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs gap-1.5 font-medium text-muted-foreground"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Redeploy
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Plugin Setup */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Key className="h-4 w-4" />
                <span>Plugin Setup</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Self-Hosting URL</span>
                  <Badge variant="outline" className="font-mono text-xs font-medium text-muted-foreground">
                    Configured
                  </Badge>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Settings</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs gap-1.5 font-medium text-muted-foreground"
                    asChild
                  >
                    <a href="obsidian://show-plugin?id=fileorganizer2000">
                      Open Plugin
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="border-t border-background-modifier-border pt-4">
            <Alert className="bg-primary/5 border-primary/10">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">Automatic Updates</AlertTitle>
              <AlertDescription className="text-primary/90">
                Your instance is automatically updated daily at midnight UTC. You can also
                manually trigger an update using the redeploy button above.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </Card>
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
      setCurrentStep(3);
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

            <div className="flex justify-between items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={deploymentStatus.isDeploying || !form.formState.isValid}
                className="flex-1"
              >
                {deploymentStatus.isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  "Deploy to Vercel"
                )}
              </Button>
            </div>
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
                      toast.success("License key copied to clipboard");
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
                      onClick={() => {
                        navigator.clipboard.writeText(deploymentStatus.projectUrl!);
                        toast.success("Project URL copied to clipboard");
                      }}
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
                      Open Plugin Settings
                    </Button>
                  </a>
                </div>
              </li>
              <li>Open Obsidian settings and go to File Organizer settings</li>
              <li>Click on Advanced and enable "Self-Hosting" toggle</li>
              <li>Enter your project URL and license key in the settings</li>
              <li>Click "Activate" in the general settings tab to complete the setup</li>
            </ol>
          </div>

          <div className="flex justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
            >
              Back
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Complete Setup
            </Button>
          </div>
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
                    <AlertCircle className="h-5 w-5 text-destructive" />
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
