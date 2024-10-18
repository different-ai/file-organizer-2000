import { LicenseForm } from "@/app/components/license-form";
import { Button } from "@/components/ui/button";
import { ArrowDownIcon } from "@/components/ui/icons";

export default function SubscribersDashboard() {
  if (process.env.ENABLE_USER_MANAGEMENT !== "true") {
    return (
      <div className="p-4 border-4 border-black text-center font-mono text-xl">
        User management is disabled
      </div>
    );
  }
  return (
    <div className="min-h-screen p-4 bg-white font-mono">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 border-b-4 border-black pb-2 uppercase">
          Subscriber Dashboard
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="border-4 border-black p-4">
            <h2 className="text-2xl font-bold mb-4 uppercase">
              Watch Tutorial
            </h2>
            <div className="aspect-video mb-4">
              <iframe
                className="w-full h-full border-2 border-black"
                src="https://www.youtube.com/embed/XZTpbECqZps?controls=1&modestbranding=1&showinfo=0"
                frameBorder="0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          <div className="border-4 border-black p-4">
            <h2 className="text-2xl font-bold mb-4 uppercase">
              Generate License
            </h2>
            <div className="p-4 mb-8">
              <LicenseForm />
            </div>

            <div className="text-center p-4">
              <ArrowDownIcon className="mx-auto h-12 w-12 text-black" />
              <p className="text-2xl font-bold mt-2 mb-4 uppercase">
                Get the plugin
              </p>
              <a href="obsidian://show-plugin?id=fileorganizer2000">
                <Button className="w-full bg-black text-white hover:bg-gray-800 uppercase">
                  Download
                </Button>
              </a>
              <p className="mt-3 text-sm">Requires Obsidian app.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
