import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@/components/ui/icons";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen p-4 bg-white font-mono ">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 border-b-4 border-black pb-2 uppercase">Welcome to File Organizer 2000</h1>

        <div className="grid grid-cols-1 gap-8">
          <div className="">
           <div className="aspect-video mb-4 max-w-3xl mx-auto">
              <iframe
                className="w-full h-full border-2 border-black"
                src="https://www.youtube.com/embed/Oo2hevCihGc?controls=1&modestbranding=1&showinfo=0"
                frameBorder="0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          <div className="border-4 border-black p-4 text-center">
            <ArrowRightIcon className="mx-auto h-12 w-12 text-black mb-4" />
            <h2 className="text-2xl font-bold mb-4 uppercase">
              Get started with File Organizer 2000
            </h2>
            <a href="/dashboard/pricing">
              <Button className="w-full max-w-xs bg-black text-white hover:bg-gray-800 uppercase">
                Choose a Plan
              </Button>
            </a>
            <p className="mt-3 text-sm">
              Powerful AI features to organize and enhance your Obsidian
              experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
