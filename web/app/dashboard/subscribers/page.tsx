import { LicenseForm } from "@/app/components/license-form";
import { Button } from "@/components/ui/button";
import { ArrowDownIcon } from "@/components/ui/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscribersDashboard() {
  if (process.env.ENABLE_USER_MANAGEMENT !== "true") {
    return (
      <div className="p-4 border border-stone-300 text-center text-xl">
        User management is disabled
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          Welcome to File Organizer 2000
        </h1>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Tutorial Card */}
          <Card className="p-4 bg-transparent bg-center bg-cover">
            <CardHeader>
              <CardTitle className="text-center mb-3">How do I use the plugin?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video mb-4">
                <iframe
                  className="w-full h-full rounded-lg shadow-lg"
                  src="https://www.youtube.com/embed/XZTpbECqZps?controls=1&modestbranding=1&showinfo=0"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </CardContent>
          </Card>

          {/* License Card */}
          <Card className="p-4 bg-transparent bg-center bg-cover">
            <CardContent>
              <div className="mb-8">
                <LicenseForm />
              </div>

              <div className="text-center">
                <ArrowDownIcon className="mx-auto h-12 w-12" />
                <p className="text-2xl font-bold mt-2 mb-4">
                  Get the plugin
                </p>
                <a href="obsidian://show-plugin?id=fileorganizer2000">
                  <Button className="w-full" variant="default">
                    Download
                  </Button>
                </a>
                <p className="mt-3 text-sm text-muted-foreground">Requires Obsidian app.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
