import { Button } from "@/components/ui/button"
import { GitHubStats } from "./GitHubStats"

export default function Hero() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <GitHubStats />
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
          Automate your Obsidian workflows
        </h1>
        <p className="text-xl mb-8 max-w-3xl">
          One plugin to auto-organize files, transcribe voice memos, and let you chat with any document—right inside Obsidian.
        </p>
        <div className="mb-12">
          <Button 
            className="bg-[var(--highlight-color)] text-[var(--font-color)] hover:opacity-90 transition-opacity mr-4"
            onClick={() => window.location.href = 'https://app.fileorganizer2000.com'}
          >
            Start Free Trial
          </Button>
          <Button variant="outline" className="border-[var(--border-color)]">Learn More</Button>
        </div>
        <div className="max-w-4xl">
          <iframe 
            className="w-full aspect-video rounded-none border border-[var(--border-color)]"
            src="https://www.youtube.com/embed/X4yN4ykTJIo?iv_load_policy=3&rel=0&modestbranding=1&playsinline=1&autoplay=1&mute=1"
            allow="autoplay; encrypted-media"
            allowFullScreen
          ></iframe>
        </div>
      </div>
      <div className="mt-24 border-t border-b border-[var(--border-color-light)] py-4 overflow-hidden">
        <div className="stats-ticker flex items-center space-x-12 text-sm mono">
          <span>+2K ACTIVE USERS</span>
          <span>•</span>
          <span>1M+ NOTES ORGANIZED</span>
          <span>•</span>
          <span>+2K ACTIVE USERS</span>
          <span>•</span>
          <span>1M+ NOTES ORGANIZED</span>
        </div>
      </div>
    </section>
  )
}

