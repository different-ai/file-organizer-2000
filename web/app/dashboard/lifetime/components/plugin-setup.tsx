import { Button } from "@/components/ui/button";

import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";

export function PluginSetup({ projectUrl }) {
  return (
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
                {projectUrl}
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
  );
} 