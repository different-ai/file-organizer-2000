// app/(landing)/page.tsx
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  PenIcon,
  FileIcon,
  LayersIcon,
  ArrowRight,
  Inbox,
  MessageSquare,
  Video,
  Star,
} from "lucide-react";
import { Demo } from "./demo/demo";
import { PricingCards } from "./components/pricing-cards";
import { FaqSection } from "./components/faq-section";
import Image from 'next/image';

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
          <div className="mb-8">
            <Image
              src="https://framerusercontent.com/images/SqHU6Ili7ACWk8dhvEPmdfXEPDA.png"
              alt="File Organizer Logo"
              width={64}
              height={64}
              className="mx-auto"
            />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            <span>Automate your</span>
            <span className="text-primary block">Formatting Workflow</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            With an Obsidian plugin that packs a powerful AI chat, automatic organization suggestions, and other wizardry.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a href="https://app.fileorganizer2000.com">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="w-full bg-background py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 text-center">
            <div>
              <h2 className="text-2xl font-normal text-muted-foreground">+2k users</h2>
            </div>
            <div>
              <h2 className="text-2xl font-normal text-muted-foreground">1M notes organized</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Video */}
      <div className="w-full max-w-4xl px-6 pb-24">
        <div className="relative aspect-video rounded-lg overflow-hidden ">
          <iframe
            src="https://www.youtube.com/embed/X4yN4ykTJIo?iv_load_policy=3&rel=0&modestbranding=1&playsinline=1"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full py-24">
        <div className="mx-auto max-w-7xl px-6">
          {/* First Feature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
            <div>
              <h2 className="text-4xl font-bold mb-4">Get organization suggestions for tags, folders, titles and templates.</h2>
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden ">
                <Image
                  src="https://framerusercontent.com/images/oURi6azSaqZ0OgErlSpbW6jBk.png"
                  alt="Organization Features"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
              </div>
            </div>
            <div>
              <p className="text-2xl text-muted-foreground">Let the AI do the thinking. Save your energy for what really matters.</p>
            </div>
          </div>

          {/* Second Feature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden ">
              <Image
                src="https://framerusercontent.com/images/deE4ZtaaqL7JMy9otNozH4yHZE.png"
                alt="Auto-Organization"
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
              />
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-4">Auto-Organizes & Formats your Notes</h2>
              <p className="text-2xl text-muted-foreground">
                Automate your organization workflow with the Inbox so you can get rid of the busywork that keeps slowing you down.
              </p>
            </div>
          </div>

          {/* Third Feature */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-4">Powerful AI Chat</h2>
              <p className="text-2xl text-muted-foreground">
                Allowing you to summarize youtube videos, search the web, or manage your vault with the latest GPT-4o model.
              </p>
            </div>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden ">
              <Image
                src="https://framerusercontent.com/images/SarnueYFDCLxQFTzsbEDNshz3n0.png"
                alt="AI Chat Features"
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
              />
            </div>
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

      {/* Media & Features Showcase */}
      <section className="w-full py-24 bg-muted/50">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">
            Discover More Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="relative aspect-video rounded-lg overflow-hidden">
              <iframe
                src="https://www.youtube.com/embed/NQjZcL4sThs?iv_load_policy=3&rel=0&modestbranding=1&playsinline=1"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
            <div className="space-y-8">
              <div className="flex justify-center">
                <Image
                  src="https://framerusercontent.com/images/deE4ZtaaqL7JMy9otNozH4yHZE.png"
                  alt="Feature Preview"
                  width={512}
                  height={512}
                  className="rounded-lg shadow-lg"
                />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4">AI-Powered Organization</h3>
                <p className="text-muted-foreground">
                  Let our intelligent system handle the organization while you focus on creating and capturing knowledge.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Testimonials Section */}
      <section className="w-full py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl font-semibold text-center mb-12">stuff people say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-background/60 backdrop-blur-sm p-8 rounded-xl border border-border/40">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-12 w-12 rounded-full overflow-hidden">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl">{testimonial.name}</h3>
                    <p className="text-muted-foreground text-sm">{testimonial.handle}</p>
                  </div>
                </div>
                <p className="text-muted-foreground">{testimonial.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FaqSection />

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
    name: "Lautaro Losio",
    handle: "@LautaroLosio",
    quote: "This is really awesome! I had a similar idea of managing files and titles using AI, but you took it to the next level. This is the best path that all of this AI nonsense can take and truly be useful. Great work!",
    avatar: "https://framerusercontent.com/images/T6fAo2ENQwZHhGKg0EW1Phoic.jpg",
  },
  {
    name: "farmhappens",
    handle: "u/farmhappens",
    quote: "This is an incredible plugin and i am finding so many uses for it. Thanks for making this - and making it open source and self hosted!",
    avatar: "https://framerusercontent.com/images/B5lCffAuQdlID00eQF9Jna0.png",
  },
  {
    name: "Mali Rasko",
    handle: "@MaliRasko",
    quote: "I tried a lot of Voice Memos-to-Obsidian workflows and this one is the best so far. Keep up :)",
    avatar: "https://framerusercontent.com/images/QZfOvbSc2pcwnwLmQULhUQ9h0UA.jpg",
  },
  {
    name: "albertleonardo",
    handle: "@albertleonardo",
    quote: "The solution that i have been looking for all this time.",
    avatar: "https://framerusercontent.com/images/aZNudzX3wJdKLGtCDHuJSM4jDc.png",
  },
  {
    name: "VitaVee",
    handle: "@VitaVee",
    quote: "The plugin has now become an integral part of my flow! It's amazing, you did a really great job guys, thanks so much for releasing this. Super happy to have taken the lifetime plan!",
    avatar: "https://framerusercontent.com/images/2PkdaHvwpLSEVM6EPAMUDDxRGD4.png",
  },
  {
    name: "ammarzahid",
    handle: "@ammarzahid",
    quote: "I was trying to incorporate my handwritten notes into obsidian from long time and it is the only setup that worked for me. I am extremely happy to find this plugin.",
    avatar: "https://framerusercontent.com/images/Xt9XL2CTd9uYeSqqZgqb75kQLQg.png",
  },
];


