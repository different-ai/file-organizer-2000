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

const formSchema = z.object({
  vercelToken: z.string().min(1, "Vercel token is required").trim(),
  openaiKey: z
    .string()
    .min(1, "OpenAI API key is required")
    .trim()
    .regex(/^sk-[a-zA-Z0-9]+$/, "OpenAI API key must start with 'sk-'"),
});

type FormValues = z.infer<typeof formSchema>;

export function AutomatedSetup() {
  const [deploymentStatus, setDeploymentStatus] = useState({
    isDeploying: false,
    error: null,
    deploymentUrl: null,
    licenseKey: null as string | null
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vercelToken: "",
      openaiKey: "",
    },
  });

  const handleDeploy = async (values: FormValues) => {
    console.log('Starting deployment process...');
    setDeploymentStatus({ 
      isDeploying: true, 
      error: null, 
      deploymentUrl: null, 
      licenseKey: null 
    });

    try {
      const result = await setupProject(values.vercelToken.trim(), values.openaiKey.trim());
      console.log('✅ Deployment completed successfully:', result);
      setDeploymentStatus({
        isDeploying: false,
        error: null,
        deploymentUrl: result.deploymentUrl,
        licenseKey: result.licenseKey
      });
    } catch (error: any) {
      console.error('❌ Deployment failed:', error);
      setDeploymentStatus({
        isDeploying: false,
        error: error.message,
        deploymentUrl: null,
        licenseKey: null
      });
    }
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleDeploy)} className="mb-8 space-y-4">
          <FormField
            control={form.control}
            name="vercelToken"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vercel Team Token</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your Vercel team token"
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
                  <Input
                    type="password"
                    placeholder="sk-..."
                    {...field}
                  />
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
            className="w-full mt-6"
          >
            {deploymentStatus.isDeploying ? 'Deploying...' : 'Deploy to Vercel'}
          </Button>
        </form>
      </Form>

      {/* Status Messages */}
      {deploymentStatus.error ? (
        <div className="text-[--text-error] mb-4">
          Error: {deploymentStatus.error}
        </div>
      ) : deploymentStatus.deploymentUrl ? (
        <div className="space-y-4 mb-4">
          <div className="text-[--text-success]">
            Deployment successful! Visit your site at:{' '}
            <a 
              href={deploymentStatus.deploymentUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline"
            >
              {deploymentStatus.deploymentUrl}
            </a>
          </div>
          {deploymentStatus.licenseKey && (
            <div className="p-4 border rounded-md bg-background">
              <p className="font-medium mb-2">Your License Key:</p>
              <div className="flex items-center gap-2">
                <code className="px-2 py-1 bg-muted rounded text-sm break-all">
                  {deploymentStatus.licenseKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(deploymentStatus.licenseKey!);
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Save this key! You'll need it to activate your plugin.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
} 