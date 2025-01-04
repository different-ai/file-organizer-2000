"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings2, Key, Wand2, Sparkles, Cpu, Bot, Braces } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getAvailableModels } from "@/lib/models";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  modelName: z.string().min(1, "Model name is required"),
  visionModelName: z.string().min(1, "Vision model name is required"),
  openaiKey: z.string().optional(),
  anthropicKey: z.string().optional(),
  googleKey: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type ConfigurationFormProps = {
  deployment: {
    modelName?: string;
    visionModelName?: string;
    openaiKeyPresent?: boolean;
    anthropicKeyPresent?: boolean;
    googleKeyPresent?: boolean;
  } | null;
  isGeneratingNewLicense: boolean;
  onGenerateLicenseChange: (value: boolean) => void;
  onSubmit: (values: FormValues & { generateNewLicenseKey: boolean }) => void;
};

export function ConfigurationForm({ 
  deployment, 
  isGeneratingNewLicense, 
  onGenerateLicenseChange,
  onSubmit 
}: ConfigurationFormProps) {
  const availableModels = getAvailableModels();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modelName: deployment?.modelName || "gpt-4o",
      visionModelName: deployment?.visionModelName || "gpt-4o",
      openaiKey: "",
      anthropicKey: "",
      googleKey: "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      generateNewLicenseKey: isGeneratingNewLicense,
    });
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-background via-background to-muted">
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5),transparent)]" />
        
        <div className="relative p-6 md:p-8">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Model Configuration</h3>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-10">
              {/* Models Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">AI Models</h4>
                </div>
                
                <Alert className="bg-primary/5 border-primary/10 text-primary/90">
                  <Bot className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    The chat will use the Text Model by default. However, when <span className="font-medium">Internet Search</span> is enabled in the plugin settings, 
                    it will automatically switch to using Gemini Flash. To use the search functionality, you'll need to have a Google API key configured.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="modelName"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-medium">Text Model</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 font-mono text-sm bg-background/50 backdrop-blur-sm border-muted-foreground/20">
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableModels.map(model => (
                              <SelectItem key={model} value={model} className="font-mono">
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Cpu className="h-3 w-3" />
                          Current: 
                          <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
                            {deployment?.modelName || 'gpt-4o (default)'}
                          </code>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="visionModelName"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-sm font-medium">Vision Model</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 font-mono text-sm bg-background/50 backdrop-blur-sm border-muted-foreground/20">
                              <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableModels.map(model => (
                              <SelectItem key={model} value={model} className="font-mono">
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Cpu className="h-3 w-3" />
                          Current: 
                          <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
                            {deployment?.visionModelName || 'gpt-4o (default)'}
                          </code>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="bg-muted-foreground/20" />

              {/* API Keys Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">API Keys</h4>
                </div>
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="openaiKey"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-medium">OpenAI API Key</FormLabel>
                          <Badge 
                            variant={deployment?.openaiKeyPresent ? "default" : "secondary"}
                            className={cn(
                              "text-xs",
                              deployment?.openaiKeyPresent && "bg-primary/15 text-primary hover:bg-primary/20"
                            )}
                          >
                            {deployment?.openaiKeyPresent ? "Configured" : "Not Set"}
                          </Badge>
                        </div>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter OpenAI API key (optional)"
                            className="h-12 bg-background/50 backdrop-blur-sm border-muted-foreground/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="anthropicKey"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-medium">Anthropic API Key</FormLabel>
                          <Badge 
                            variant={deployment?.anthropicKeyPresent ? "default" : "secondary"}
                            className={cn(
                              "text-xs",
                              deployment?.anthropicKeyPresent && "bg-primary/15 text-primary hover:bg-primary/20"
                            )}
                          >
                            {deployment?.anthropicKeyPresent ? "Configured" : "Not Set"}
                          </Badge>
                        </div>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter Anthropic API key (optional)"
                            className="h-12 bg-background/50 backdrop-blur-sm border-muted-foreground/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="googleKey"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-sm font-medium">Google API Key</FormLabel>
                          <Badge 
                            variant={deployment?.googleKeyPresent ? "default" : "secondary"}
                            className={cn(
                              "text-xs",
                              deployment?.googleKeyPresent && "bg-primary/15 text-primary hover:bg-primary/20"
                            )}
                          >
                            {deployment?.googleKeyPresent ? "Configured" : "Not Set"}
                          </Badge>
                        </div>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter Google API key (optional)"
                            className="h-12 bg-background/50 backdrop-blur-sm border-muted-foreground/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator className="bg-muted-foreground/20" />

              {/* License Key Generation */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Braces className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">License Key</h4>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-muted-foreground/20">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Generate New License Key</label>
                    <p className="text-sm text-muted-foreground">
                      Create a new license key for your instance
                    </p>
                  </div>
                  <Switch
                    checked={isGeneratingNewLicense}
                    onCheckedChange={onGenerateLicenseChange}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                {isGeneratingNewLicense && (
                  <Alert variant="warning" className="bg-yellow-500/10 border-yellow-500/20">
                    <Wand2 className="h-4 w-4 text-yellow-500" />
                    <AlertTitle className="text-yellow-500">New License Key Generation</AlertTitle>
                    <AlertDescription className="text-yellow-500/90">
                      This will create a new license key and update your deployment. 
                      Make sure to update your plugin settings afterward.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-base font-medium"
                >
                  <Key className="mr-2 h-4 w-4" />
                  {isGeneratingNewLicense ? 'Update Configuration & Generate Key' : 'Update Configuration'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Card>
  );
} 