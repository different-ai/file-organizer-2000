// app/(landing)/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  PenIcon,
  FileIcon,
  LayersIcon,
  ArrowRight,
  Inbox,
  MessageSquare,
  Video,
} from "lucide-react";
import { Demo } from "./demo/demo";
import { IntegrationsGrid } from "./components/integrations-grid";
import { enterpriseIntegrations } from "./data/integrations";
import { PricingCards } from "./components/pricing-cards";

export const metadata: Metadata = {
  title: "note companion — your ai-powered knowledge partner",
  description:
    "achieve seamless meeting notes, instant handwriting digitization, and the smartest ai chat for your obsidian workflow. one tool, endless possibilities.",
  openGraph: {
    title: "note companion — your ai-powered knowledge partner",
    description:
      "achieve seamless meeting notes, instant handwriting digitization, and the smartest ai chat for your obsidian workflow. one tool, endless possibilities.",
  },
};

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      {/* Hero Section */}
      <div className="w-full max-w-5xl px-6 py-24 sm:py-32 lg:px-8 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text ">
            Note Companion for Obsidian
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Your AI-powered assistant that turns scattered notes into actionable knowledge.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a href="https://app.fileorganizer2000.com">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Start 7-Day Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Meet Your All-in-One Workflow Buddy */}
      <div className="w-full bg-muted/50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-12 text-center">
            Meet Your All-in-One Workflow Buddy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Inbox Feature */}
            <div className="bg-background/60 backdrop-blur-sm p-8 rounded-xl border border-border/40">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Inbox className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Inbox</h3>
              <p className="text-muted-foreground mb-4">
                Instantly organize any dragged-and-dropped file. Note Companion automatically detects relevant tags and suggests the best folder or location.
              </p>
            </div>

            {/* Meetings Feature */}
            <div className="bg-background/60 backdrop-blur-sm p-8 rounded-xl border border-border/40">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Meetings</h3>
              <p className="text-muted-foreground mb-4">
                Supercharge your meeting notes using ScreenPipe, which continuously records your conversation. Tap "Enhance Meeting Note" and watch as it merges the last few minutes of discussion with your current file for perfectly contextualized notes.
              </p>
            </div>

            {/* Chat Feature */}
            <div className="bg-background/60 backdrop-blur-sm p-8 rounded-xl border border-border/40">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Chat</h3>
              <p className="text-muted-foreground mb-4">
                Chat directly with your notes and bring other documents or folders into the conversation with a simple @ mention. Ask Note Companion to modify text, add summaries, rename files, or even split your notes—all in real time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why Note Companion */}
      <div className="w-full py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-12 text-center">
            Why Note Companion?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Automated Organization</h3>
              <p className="text-muted-foreground">
                No more manual tagging or folder wrangling. Let AI do the heavy lifting.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Instant Insight</h3>
              <p className="text-muted-foreground">
                Seamlessly merge new discussions or files with existing notes, so everything stays updated and easy to find.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Powerful Editing Tools</h3>
              <p className="text-muted-foreground">
                Rename, split, or refine notes with a quick command.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Deep Context</h3>
              <p className="text-muted-foreground">
                AI suggestions factor in the content of your entire vault, ensuring you always get the most relevant tags and folders.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="w-full max-w-[1200px] px-6 py-24 bg-muted/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            See it in Action
          </h2>
          <p className="text-lg text-muted-foreground">
            Experience how Note Companion transforms your workflow
          </p>
        </div>
        <Demo />
      </div>

      {/* Pricing Section */}
      <div className="w-full py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Simple, Flexible Pricing
            </h2>
            <p className="text-lg text-muted-foreground mb-12">
              Whether you're a solo note-taker or a power user looking for advanced features, we've got you covered.
            </p>
          </div>
          <PricingCards />
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full bg-muted/50">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              Ready to revolutionize your note-taking?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Get Note Companion and enjoy a 7-day free trial on any paid plan. Bring order to your Obsidian vault. Stop wrestling with messy notes and let AI handle the tedious tasks—so you can focus on what really matters.
            </p>
            <div className="flex items-center justify-center gap-x-6">
              <a href="https://app.fileorganizer2000.com">
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const features = [
  {
    title: "Smart File Placement",
    description:
      "Clever AI recommendations ensure each note and file lands in the perfect spot.",
    icon: <FileIcon className="h-6 w-6 text-white" />,
  },
  {
    title: "Note Refinement",
    description:
      "Auto-polish your text for structure and style—goodbye, messy formatting.",
    icon: <PenIcon className="h-6 w-6 text-white" />,
  },
  {
    title: "Bulk Operations",
    description:
      "Move, rename, or tag entire groups of files in seconds, saving massive chunks of time.",
    icon: <LayersIcon className="h-6 w-6 text-white" />,
  },
];

/* example testimonials data */
const testimonials = [
  {
    name: "alice johnson",
    company: "openmind labs",
    quote:
      "it's astonishing how seamlessly note companion merges voice transcripts with typed notes—like a personal meeting historian!",
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
  },
  {
    name: "charlie davis",
    company: "hitchhike.ai",
    quote:
      "the handwriting-to-text pipeline is mind-blowing. i just snap a photo of my scribbles, and everything's in obsidian!",
    avatar: "https://randomuser.me/api/portraits/men/34.jpg",
  },
  {
    name: "joanna meek",
    company: "futura devs",
    quote:
      "the context-aware chat has become my personal wiki—it pulls everything i need from my vault in a heartbeat.",
    avatar: "https://randomuser.me/api/portraits/women/56.jpg",
  },
  {
    name: "samuel r. hodge",
    company: "venture space",
    quote:
      "simply the best obsidian add-on i've come across. note companion keeps my vault tidy so i can focus on content creation.",
    avatar: "https://randomuser.me/api/portraits/men/92.jpg",
  },
];
