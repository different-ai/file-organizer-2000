"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ExternalLink, Loader2, RefreshCw, Globe, Clock, Settings2, Key, Server } from "lucide-react";
import { type DeploymentStatus as DeploymentStatusType } from "../actions";
import { cn } from "@/lib/utils";

type DeploymentStatusProps = {
  deployment: DeploymentStatusType | null;
  isRedeploying: boolean;
  onRedeploy: () => void;
};

export function DeploymentStatus({ deployment, isRedeploying, onRedeploy }: DeploymentStatusProps) {
  return (
    <Card className="bg-gradient-to-br from-background to-muted/30">
      <div className="grid gap-6 border rounded-lg p-4">
        {/* Project URL */}
        {deployment?.projectUrl && (
          <div className="flex items-center gap-4">
            <code className="flex-1 px-4 py-2 bg-muted/50 rounded-md text-sm font-mono break-all">
              {deployment.projectUrl}
            </code>
            <Button 
              variant="outline" 
              onClick={() => window.open(deployment.projectUrl!, '_blank')}
              className="h-9 gap-2 bg-background/50 backdrop-blur-sm border-muted-foreground/20"
            >
              <Globe className="h-4 w-4" />
              Visit Site
              <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
            </Button>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Current Configuration */}
          <div className="space-y-2 md:border-r border-background-modifier-border md:pr-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Settings2 className="h-4 w-4" />
              <span>Configuration</span>
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
          <div className="space-y-2 md:border-r border-background-modifier-border md:pr-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Key className="h-4 w-4" />
              <span>API Keys</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">OpenAI</span>
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
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Anthropic</span>
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
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Google</span>
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
            </div>
          </div>

          {/* Deployment Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Server className="h-4 w-4" />
              <span>Deployment</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge 
                  variant={deployment?.isDeploying ? "secondary" : deployment?.deploymentError ? "destructive" : "default"}
                  className={cn(
                    "text-xs",
                    deployment?.isDeploying && "animate-pulse bg-primary/15 text-primary",
                    !deployment?.isDeploying && !deployment?.deploymentError && "bg-primary/15 text-primary"
                  )}
                >
                  {deployment?.isDeploying ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Deploying
                    </span>
                  ) : deployment?.deploymentError ? (
                    "Failed"
                  ) : (
                    "Ready"
                  )}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Last Update</span>
                <span className="text-xs text-muted-foreground">
                  {deployment?.lastDeployment 
                    ? new Date(deployment.lastDeployment).toLocaleString()
                    : 'Never'}
                </span>
              </div>
              {!isRedeploying && !deployment?.isDeploying && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Action</span>
                  <Button
                    onClick={onRedeploy}
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs gap-1.5 font-medium text-muted-foreground"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Force Deploy
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {(deployment?.deploymentError || deployment?.isDeploying) && (
          <div className="border-t border-background-modifier-border pt-4">
            {deployment?.deploymentError && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertTitle className="text-red-500">Deployment Failed</AlertTitle>
                <AlertDescription className="text-red-500/90">
                  {deployment.deploymentError}
                </AlertDescription>
              </Alert>
            )}
            {deployment?.isDeploying && (
              <Alert className="bg-primary/5 border-primary/10">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <AlertTitle className="text-primary">Deployment in Progress</AlertTitle>
                <AlertDescription className="text-primary/90">
                  Your instance is being updated. This may take a few minutes.
                  The page will automatically refresh when the deployment is complete.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    </Card>
  );
} 