import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { LicenseForm } from "@/app/components/license-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LifetimeAccessPage() {
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
        <h1 className="text-4xl font-bold mb-8">Lifetime Access Setup</h1>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <Card className="p-4 bg-transparent bg-center bg-cover">
              <CardContent>
                <div className="aspect-video mb-4">
                  <iframe
                    className="w-full h-full rounded-lg shadow-lg"
                    src="https://www.youtube.com/embed/hOobrzAlW3Q?controls=1&modestbranding=1&showinfo=0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-8 p-4 bg-transparent">
              <CardHeader>
                <CardTitle>Generate License</CardTitle>
              </CardHeader>
              <CardContent>
                <LicenseForm />
              </CardContent>
            </Card>
          </div>
          
          <Card className="p-4 bg-transparent">
            <CardContent>
              <ol className="space-y-4">
                <li className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                  <strong>Deploy your instance:</strong>
                  <div className="flex gap-4 mt-2 items-center">
                    <a
                      href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdifferent-ai%2Ffile-organizer-2000%2Ftree%2Fmaster%2Fweb&env=OPENAI_API_KEY,SOLO_API_KEY&envDescription=For%20SOLO_API_KEY%2C%20enter%20your%20lifetime%20license%20key%20you%20generated%20on%20the%20dashboard&envLink=https%3A%2F%2Fgithub.com%2Fdifferent-ai%2Ffile-organizer-2000%2Fblob%2Fmaster%2Ftutorials%2Fenv-vars.md&project-name=file-organizer-2000&repository-name=file-organizer-2000&build-command=npm%20run%20build:self-host"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src="https://vercel.com/button"
                        alt="Deploy with Vercel"
                        className="hover:bg-gray-200 transition-colors"
                      />
                    </a>
                    or
                    <a
                      href="https://render.com/deploy?repo=https://github.com/different-ai/file-organizer-2000"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src="https://render.com/images/deploy-to-render-button.svg"
                        alt="Deploy to Render"
                        className="rounded-md hover:bg-gray-200 transition-colors"
                      />
                    </a>
                  </div>
                  <ul className="list-disc list-inside mt-4 text-sm">
                    <li>You'll need to sign up/in on Vercel and GitHub.</li>
                    <li>
                      During deployment, enter your{" "}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        OpenAI API Key
                      </a>
                      . Make sure you have added credits to your account.
                    </li>
                    <li>
                      For the SOLO_API_KEY, use the license key generated in the "Generate License" section below.
                    </li>
                  </ul>
                  <p className="mt-4 text-sm">
                    <strong>Note on Render:</strong> Deployment on Render costs €7/month. However, Render provides automatic updates for your installation, ensuring you always have the latest version.
                  </p>
                </li>
                <li className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                  <strong>Configure plugin:</strong>
                  <ul className="list-disc list-inside mt-2">
                    <li>Go to Obsidian settings</li>
                    <li>Enable "Self-Hosting" toggle</li>
                    <li>Enter your Vercel URL</li>
                  </ul>
                </li>
                <li className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                  <strong>Activate license:</strong>
                  <ul className="list-disc list-inside mt-2">
                    <li>Enter license key in plugin settings</li>
                    <li>Click "Activate" button</li>
                  </ul>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
        
        <footer className="mt-12 text-center">
          <Card className="p-4 bg-transparent inline-block">
            <CardHeader>
              <CardTitle className="text-center mb-3">Get the Plugin</CardTitle>
            </CardHeader>
            <CardContent>
              <a href="obsidian://show-plugin?id=fileorganizer2000">
                <Button className="w-full" variant="default">Download</Button>
              </a>
              <p className="mt-3 text-sm text-muted-foreground">Requires Obsidian app.</p>
            </CardContent>
          </Card>
        </footer>
      </main>
    </div>
  );
}