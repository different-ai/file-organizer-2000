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
import { Card } from "@/components/ui/card";
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
import { toast } from "react-hot-toast";
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
    } catch (error: unknown) {
      const deploymentError = error as DeploymentError;
      setDeploymentStatus({
        isDeploying: false,
        error: deploymentError.message,
        deploymentUrl: null,
        licenseKey: null,
        projectUrl: null,
      });
    }
  };

  return (
    <Card className="bg-gradient-to-br from-background to-muted/30">
      <div className="grid gap-6 border rounded-lg p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleDeploy)} className="space-y-6">
            {/* Vercel Token */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Key className="h-4 w-4" />
                <span>Vercel Token</span>
              </div>

              <FormField
                control={form.control}
                name="vercelToken"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="relative">
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your Vercel token"
                          className="h-9 bg-background/50 backdrop-blur-sm border-muted-foreground/20 pr-9"
                          {...field}
                        />
                      </FormControl>
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* OpenAI Key */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Key className="h-4 w-4" />
                <span>OpenAI API Key</span>
              </div>

              <FormField
                control={form.control}
                name="openaiKey"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <div className="relative">
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="sk-..."
                          className="h-9 bg-background/50 backdrop-blur-sm border-muted-foreground/20 pr-9"
                          {...field}
                        />
                      </FormControl>
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <FormMessage className="text-xs" />
                    <p className="text-xs text-muted-foreground">
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
            </div>

            <Button
              type="submit"
              disabled={deploymentStatus.isDeploying || !form.formState.isValid}
              className="w-full h-9 text-sm font-medium"
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
          </form>
        </Form>

        {/* Error message */}
        {deploymentStatus.error && (
          <div className="border-t border-background-modifier-border pt-4">
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-500">Deployment Failed</AlertTitle>
              <AlertDescription className="text-red-500/90">
                {deploymentStatus.error}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </Card>
  );
}
