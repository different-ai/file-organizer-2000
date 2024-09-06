import { Button } from "@/components/ui/button";
import { ArrowDownIcon } from "@/components/ui/icons";
import UserManagement from "@/components/user-management";
import { LicenseForm } from "../components/license-form";

export default function SubscribersDashboard() {
  if (process.env.ENABLE_USER_MANAGEMENT !== "true") {
    return <div>User management is disabled</div>;
  }
  return (
    <div className="flex min-h-screen py-7 px-4 sm:px-6 lg:px-8 flex-col">
      <div className="flex-1 mb-8 flex items-center justify-center pt-16">
        <div className="flex flex-col lg:flex-row w-full max-w-6xl items-center">
          <div className="w-full lg:w-1/2 rounded-lg overflow-hidden mb-8 lg:mb-0 lg:mr-40">
            <div className="relative" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full hidden md:block"
                src="https://www.youtube.com/embed/XZTpbECqZps?controls=0&modestbranding=1&showinfo=0"
                frameBorder="0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            <div className="relative mt-4 md:pb-0 pb-[56.25%]">
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
            <LicenseForm />
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