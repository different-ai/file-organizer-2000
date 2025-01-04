"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { type DeploymentStatus as DeploymentStatusType } from "../actions";

type DeploymentStatusProps = {
  deployment: DeploymentStatusType | null;
  isRedeploying: boolean;
  onRedeploy: () => void;
};

export function DeploymentStatus({ deployment, isRedeploying, onRedeploy }: DeploymentStatusProps) {
  const getStatusBadge = () => {
    if (isRedeploying || deployment?.isDeploying) {
      return (
        <Badge variant="secondary" className="animate-pulse">
          Deploying
        </Badge>
      );
    }

    if (deployment?.deploymentError) {
      return (
        <Badge variant="destructive">
          Error
        </Badge>
      );
    }

    return (
      <Badge variant={deployment?.lastDeployment ? "success" : "secondary"}>
        {deployment?.lastDeployment ? "Active" : "Not Deployed"}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Deployment Status
              {getStatusBadge()}
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
                <Button size="icon" variant="outline" onClick={() => window.open(deployment.projectUrl!, '_blank')}>
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

        {!isRedeploying && !deployment?.isDeploying && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Deployment Required</AlertTitle>
            <AlertDescription>
              After updating your configuration, you'll need to redeploy your instance for changes to take effect.
            </AlertDescription>
          </Alert>
        )}

        {(isRedeploying || deployment?.isDeploying) && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Deployment in Progress</AlertTitle>
            <AlertDescription>
              Your instance is being updated. This may take a few minutes.
              The page will automatically refresh when the deployment is complete.
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={onRedeploy}
          disabled={isRedeploying || deployment?.isDeploying}
          className="w-full"
          size="lg"
        >
          {isRedeploying || deployment?.isDeploying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isRedeploying ? 'Deploying Changes...' : 'Deployment in Progress...'}
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Deploy Changes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
} 