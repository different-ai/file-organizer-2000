"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Loader2, RefreshCw, Settings2, Key, Wand2, AlertCircle, ExternalLink } from "lucide-react";
import { updateKeys } from "./actions";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getAvailableModels } from "@/lib/models";

export default function DeploymentDashboard() {
  const [deployment, setDeployment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeploying, setIsRedeploying] = useState(false);
  const [modelName, setModelName] = useState('');
  const [visionModelName, setVisionModelName] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [isGeneratingNewLicense, setIsGeneratingNewLicense] = useState(false);
  const [availableModels] = useState(() => getAvailableModels());

  useEffect(() => {
    fetchDeploymentStatus();
  }, []);

  const fetchDeploymentStatus = async () => {
    try {
      const response = await fetch('/api/deployment/status');
      const data = await response.json();
      setDeployment(data);
    } catch (error) {
      toast.error('Failed to fetch deployment status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeploy = async () => {
    setIsRedeploying(true);
    try {
      const response = await fetch('/api/redeploy', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to redeploy');
      
      toast.success('Redeployment triggered successfully');
      await fetchDeploymentStatus();
    } catch (error) {
      toast.error('Failed to trigger redeployment');
    } finally {
      setIsRedeploying(false);
    }
  };

  const handleUpdateKeys = async () => {
    try {
      const result = await updateKeys({
        modelName,
        visionModelName,
        openaiKey,
        anthropicKey,
        generateNewLicenseKey: isGeneratingNewLicense,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      if (result.newLicenseKey) {
        toast.success('New license key generated successfully');
      }
      
      toast.success('Configuration updated successfully');
      setOpenaiKey('');
      setAnthropicKey('');
      await fetchDeploymentStatus();
    } catch (error) {
      toast.error(error.message || 'Failed to update configuration');
    }
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

      <div className="grid gap-6">
        {/* Status Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  Deployment Status
                  <Badge variant={deployment?.lastDeployment ? "success" : "secondary"}>
                    {deployment?.lastDeployment ? "Active" : "Not Deployed"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Your instance details and deployment controls
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project URL</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-1 bg-muted rounded text-sm font-mono break-all">
                    {deployment?.projectUrl || 'Not deployed'}
                  </code>
                  {deployment?.projectUrl && (
                    <Button size="icon" variant="outline" onClick={() => window.open(deployment.projectUrl, '_blank')}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Deployed</label>
                <p className="text-sm text-muted-foreground">
                  {deployment?.lastDeployment 
                    ? new Date(deployment.lastDeployment).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Deployment Required</AlertTitle>
              <AlertDescription>
                After updating your configuration, you'll need to redeploy your instance for changes to take effect.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleRedeploy}
              disabled={isRedeploying}
              className="w-full"
              size="lg"
            >
              {isRedeploying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redeploying Instance...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Redeploy Instance
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Model Configuration
              </CardTitle>
              <CardDescription>
                Configure your AI models and API keys
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Models */}
            <div className="space-y-6">
              <h3 className="text-sm font-medium text-muted-foreground">Models</h3>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Text Model</label>
                  <Select
                    value={modelName}
                    onValueChange={setModelName}
                  >
                    <SelectTrigger className="font-mono">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map(model => (
                        <SelectItem key={model} value={model} className="font-mono">
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Current model: 
                    <code className="px-1 py-0.5 bg-muted rounded text-xs">
                      {deployment?.modelName || 'gpt-4o (default)'}
                    </code>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Vision Model</label>
                  <Select
                    value={visionModelName}
                    onValueChange={setVisionModelName}
                  >
                    <SelectTrigger className="font-mono">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map(model => (
                        <SelectItem key={model} value={model} className="font-mono">
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    Current model: 
                    <code className="px-1 py-0.5 bg-muted rounded text-xs">
                      {deployment?.visionModelName || 'gpt-4o (default)'}
                    </code>
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* API Keys */}
            <div className="space-y-6">
              <h3 className="text-sm font-medium text-muted-foreground">API Keys</h3>
              <div className="grid gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">OpenAI API Key</label>
                    <Badge variant={deployment?.openaiKeyPresent ? "success" : "secondary"}>
                      {deployment?.openaiKeyPresent ? "Configured" : "Not Set"}
                    </Badge>
                  </div>
                  <Input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="Enter OpenAI API key (optional)"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Anthropic API Key</label>
                    <Badge variant={deployment?.anthropicKeyPresent ? "success" : "secondary"}>
                      {deployment?.anthropicKeyPresent ? "Configured" : "Not Set"}
                    </Badge>
                  </div>
                  <Input
                    type="password"
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder="Enter Anthropic API key (optional)"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* License Key Generation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Generate New License Key</label>
                  <p className="text-xs text-muted-foreground">
                    Create a new license key for your instance
                  </p>
                </div>
                <Switch
                  checked={isGeneratingNewLicense}
                  onCheckedChange={setIsGeneratingNewLicense}
                />
              </div>

              {isGeneratingNewLicense && (
                <Alert variant="warning">
                  <Wand2 className="h-4 w-4" />
                  <AlertTitle>New License Key Generation</AlertTitle>
                  <AlertDescription>
                    This will create a new license key and update your deployment. 
                    Make sure to update your plugin settings afterward.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Button
              onClick={handleUpdateKeys}
              disabled={!modelName || (!openaiKey && !anthropicKey)}
              size="lg"
              className="w-full"
            >
              <Key className="mr-2 h-4 w-4" />
              {isGeneratingNewLicense ? 'Update Configuration & Generate Key' : 'Update Configuration'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 