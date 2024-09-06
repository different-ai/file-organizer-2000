import { Button } from "@/components/ui/button";
import { ArrowDownIcon } from "@/components/ui/icons";

export default function NoUserManagementPage() {
  return (
    <div className="flex min-h-screen py-7 px-4 sm:px-6 lg:px-8 flex-col">
      <div className="flex-1 mb-8 flex items-center justify-center pt-16">
        <div className="flex flex-col w-full max-w-6xl items-center">
          <p className="text-gray-500 dark:text-gray-400 px-4 mb-8">
            Just paste this URL in the plugin settings in Obsidian and you're
            good to go!
          </p>
          <div className="text-center">
            <ArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-gray-800 mt-6 text-xl sm:text-2xl font-extrabold mt-2 mb-4">
              Get the plugin
            </p>
            <a href="obsidian://show-plugin?id=fileorganizer2000">
              <Button className="max-w-xs w-full sm:w-auto">Download</Button>
            </a>
            <p className="mt-3 text-sm text-gray-600">Requires Obsidian app.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
