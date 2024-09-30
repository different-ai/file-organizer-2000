import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { LicenseForm } from "@/app/components/license-form";

function UserManagement() {
  return (
    <div className="absolute top-4 right-4 flex items-center gap-4">
      <a href="https://discord.gg/udQnCRFyus" target="_blank">
        <Button className="border whitespace-nowrap">Join our discord</Button>
      </a>
      <a href={process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL}>
        <Button variant="secondary">Subscription</Button>
      </a>
      <UserButton />
    </div>
  );
}

export default async function LifetimeAccessPage() {
  if (process.env.ENABLE_USER_MANAGEMENT !== "true") {
    return <div>User management is disabled</div>;
  }
  return (
    <div className="min-h-screen p-4 bg-gray-100 font-mono">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 border-b-4 border-black pb-2">Lifetime Access Setup</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4 uppercase">Watch Tutorial</h2>
            <div className="aspect-video">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/hOobrzAlW3Q?controls=1&modestbranding=1&showinfo=0"
                frameBorder="0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4 uppercase">Generate License</h2>
              <div className="border-2 border-black p-4">
                <LicenseForm />
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-4 uppercase">Setup Instructions</h2>
            <ol className="list-decimal list-inside space-y-4">
              <li className="border-2 border-black p-4">
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
              <li className="border-2 border-black p-4">
                <strong>Configure plugin:</strong>
                <ul className="list-disc list-inside mt-2">
                  <li>Go to Obsidian settings</li>
                  <li>Enable "Self-Hosting" toggle</li>
                  <li>Enter your Vercel URL</li>
                </ul>
              </li>
              <li className="border-2 border-black p-4">
                <strong>Activate license:</strong>
                <ul className="list-disc list-inside mt-2">
                  <li>Enter license key in plugin settings</li>
                  <li>Click "Activate" button</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4 uppercase">Get the Plugin</h2>
          <a href="obsidian://show-plugin?id=fileorganizer2000">
            <Button className="w-full max-w-xs bg-black text-white hover:bg-gray-800">Download</Button>
          </a>
          <p className="mt-3 text-sm">Requires Obsidian app.</p>
        </div>
      </div>
    </div>
  );
}