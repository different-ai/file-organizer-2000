"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { setupProject } from "./action";
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
import { CheckCircle2, ChevronRight } from "lucide-react";

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vercelToken: "",
      openaiKey: "",
    },
  });

  const handleDeploy = async (values: FormValues) => {
    setDeploymentStatus({
      isDeploying: true,
      error: null,
      deploymentUrl: null,
      licenseKey: null,
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
          {deploymentStatus.licenseKey && (
            <Card className="border bg-muted/50 ">
              <CardHeader>
                <CardTitle className="text-lg">Your License Key</CardTitle>
              </CardHeader>
              <CardContent>
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
            <ol className="list-decimal list-inside space-y-2 text-sm">
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
              <li>
                Enter your project URL:{" "}
                <code className="px-2 py-1 bg-muted rounded text-sm">
                  {deploymentStatus.projectUrl}
                </code>
              </li>
              <li>Enter your license key and click "Activate"</li>
            </ol>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto">
      <Card className="border-none bg-gradient-to-b from-background to-muted/50 shadow-md p-8 rounded-md">
        <CardHeader className="pb-8 text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
            Self-Hosting Setup
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Follow these steps to set up your own instance
          </p>
        </CardHeader>
        <CardContent>
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
