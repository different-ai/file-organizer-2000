import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";
import UserManagement from "@/components/user-management";

const PlayIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-6 h-6"
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen py-7 px-4 sm:px-6 lg:px-8 flex-col">
      <div className="flex-1 mb-8 flex items-center justify-center pt-16">
        <div className="flex flex-col w-full max-w-6xl items-center">
          <p className="text-gray-500 dark:text-gray-400 px-4 mb-8 text-center">
            Welcome to File Organizer 2000!
          </p>
          <div className="w-full rounded-lg overflow-hidden mb-8 max-w-2xl">
            <div className="relative" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full hidden md:block"
                src="https://www.youtube.com/embed/Oo2hevCihGc?controls=1&modestbranding=1&showinfo=0"
                frameBorder="0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <iframe
                className="absolute top-0 left-0 w-full h-full md:hidden"
                src="https://www.youtube.com/embed/Oo2hevCihGc"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>
          <div className="text-center">
            <ArrowRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-gray-800 mt-6 text-xl sm:text-2xl font-extrabold mt-2 mb-4">
              Get started with File Organizer 2000
            </p>
            <a href="/dashboard/planSelection">
              <Button className="max-w-xs w-full sm:w-auto">
                Choose a Plan
              </Button>
            </a>
            <p className="mt-3 text-sm text-gray-600">
              Powerful AI features to organize and enhance your Obsidian
              experience.
            </p>
          </div>
        </div>
      </div>
      <UserManagement />
    </div>
  );
}
