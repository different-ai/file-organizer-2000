import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { LicenseForm } from "../components/license-form";
import { ArrowDownIcon } from "@/components/ui/icons";

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
  const { userId } = auth();

  // uncoment before september 30th
  // const billingCycle = await getUserBillingCycle(userId);
  // if (billingCycle !== "lifetime") {
  //   return <div>Access denied. This page is for lifetime subscribers only.</div>;
  // }

  return (
    <div className="flex min-h-screen py-7 px-4 sm:px-6 lg:px-8 flex-col">
      <div className="flex-1 mb-8 flex items-center justify-center pt-16">
        <div className="flex flex-col lg:flex-row w-full max-w-6xl items-center">
          <div className="w-full lg:w-1/2 rounded-lg overflow-hidden mb-8 lg:mb-0 lg:mr-40">
            <div className="relative" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full hidden md:block"
                src="https://www.youtube.com/embed/XYLgqdtoeMo?controls=1&modestbranding=1&showinfo=0"
                frameBorder="0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="relative mt-4" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full md:hidden"
                src="https://www.youtube.com/embed/videoseries?list=PLgRcC-DFR5jdUxbSBuNeymwYTH_FSVxio"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>
          <div className="flex-1 space-y-8 flex flex-col">
            <div className="flex flex-col">
              <div className="w-full mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-xl mx-auto">
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
                    Setup Instructions for Lifetime Access
                  </h2>
                  <ol className="list-decimal list-outside ml-4 space-y-4 text-gray-700 dark:text-gray-300">
                    <li>
                      <strong>Deploy your own instance:</strong>
                      <a
                        href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdifferent-ai%2Ffile-organizer-2000%2Ftree%2Fmaster%2Fweb&env=OPENAI_API_KEY,SOLO_API_KEY&envDescription=For%20SOLO_API_KEY%2C%20enter%20your%20lifetime%20license%20key%20you%20generated%20on%20the%20dashboard&envLink=https%3A%2F%2Fgithub.com%2Fdifferent-ai%2Ffile-organizer-2000%2Fblob%2Fmaster%2Ftutorials%2Fenv-vars.md&project-name=file-organizer-2000&repository-name=file-organizer-2000&build-command=npm%20run%20build:self-host"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-2"
                      >
                        <img
                          src="https://vercel.com/button"
                          alt="Deploy with Vercel"
                          className="hover:opacity-80 transition-opacity"
                        />
                      </a>
                      <ul className="list-disc list-outside ml-4 mt-2 space-y-1 text-sm">
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
                          .
                        </li>
                        <li>
                          For the SOLO_API_KEY, use the license key generated
                          below.
                        </li>
                      </ul>
                    </li>
                    <li>
                      <strong>Configure plugin settings:</strong>
                      <ul className="list-disc list-outside ml-4 mt-2 space-y-1 text-sm">
                        <li>
                          In Obsidian, go to Settings &gt; Community Plugins
                          &gt; File Organizer 2000 &gt; Advanced Settings
                        </li>
                        <li>Enable "Self-Hosting" toggle</li>
                        <li>
                          In the "Server URL" field, enter your Vercel
                          deployment URL
                        </li>
                      </ul>
                    </li>
                    <li>
                      <strong>Activate your license:</strong>
                      <ul className="list-disc list-outside ml-4 mt-2 space-y-1 text-sm">
                        <li>
                          In the plugin settings, enter your license key in the
                          "File Organizer License Key" field.
                        </li>
                        <li>
                          Click the "Activate" button to activate your license.
                        </li>
                      </ul>
                    </li>
                    <li>
                      <strong>That's it! 🎉</strong>
                      <ul className="list-disc list-outside ml-4 mt-2 space-y-1 text-sm">
                        <li>
                          Now open the assistant sidebar to see if it works.
                          Enjoy the plugin!
                        </li>
                      </ul>
                    </li>
                  </ol>
                </div>
              </div>
              <div className="flex flex-col justify-center items-center text-center">
                <LicenseForm />
              </div>
            </div>
            <div className="text-center">
              <ArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-800 mt-6 text-xl sm:text-2xl font-extrabold mt-2 mb-4">
                Get the plugin
              </p>
              <a href="obsidian://show-plugin?id=fileorganizer2000">
                <Button className="max-w-xs w-full sm:w-auto">Download</Button>
              </a>
              <p className="mt-3 text-sm text-gray-600">
                Requires Obsidian app.
              </p>
            </div>
          </div>
        </div>
      </div>
      <UserManagement />
    </div>
  );
}
