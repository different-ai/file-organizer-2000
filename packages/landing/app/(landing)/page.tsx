// app/(landing)/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, PenIcon, FileIcon, LayersIcon, ArrowRight } from 'lucide-react'
import { Demo } from './demo/demo'
import { IntegrationsGrid } from './components/integrations-grid'
import { enterpriseIntegrations } from './data/integrations'
import { PricingCards } from './components/pricing-cards'

export const metadata: Metadata = {
  title: 'note companion — your ai-powered knowledge partner',
  description:
    'achieve seamless meeting notes, instant handwriting digitization, and the smartest ai chat for your obsidian workflow. one tool, endless possibilities.',
  openGraph: {
    title: 'note companion — your ai-powered knowledge partner',
    description:
      'achieve seamless meeting notes, instant handwriting digitization, and the smartest ai chat for your obsidian workflow. one tool, endless possibilities.',
  },
}

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      {/* Hero Section */}
      <div className="w-full max-w-5xl px-6 py-24 sm:py-32 lg:px-8 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text ">
            AI-Powered File Organization
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Transform your messy files into a well-organized knowledge base. Let AI handle the heavy lifting while you focus on what matters.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg">
              View Documentation
            </Button>
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="w-full max-w-[1200px] px-6 pb-24">
        <Demo />
      </div>

      {/* Features Section */}
      <div className="w-full bg-muted/50">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary">Faster Processing</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to organize your files
            </p>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Stop wasting time manually organizing files. Our AI understands your content and automatically categorizes, tags, and structures your files.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="flex flex-col">
                  <dt className="text-base font-semibold leading-7 text-foreground">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                      {feature.icon}
                    </div>
                    {feature.title}
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Integrations Section */}
      <div className="w-full py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Powerful Integrations
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Connect with your favorite tools and services to supercharge your workflow.
            </p>
          </div>
       </div>
      </div>

      {/* Pricing Section */}
      <div className="w-full py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Choose the plan that works best for you. All plans include a 7-day free trial.
            </p>
          </div>
          <PricingCards />
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full bg-muted/50">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Join thousands of users who have transformed their workflow with our AI-powered file organization.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

const features = [
  {
    title: 'Smart File Placement',
    description:
      'Clever AI recommendations ensure each note and file lands in the perfect spot.',
    icon: <FileIcon className="h-6 w-6 text-white" />,
  },
  {
    title: 'Note Refinement',
    description:
      'Auto-polish your text for structure and style—goodbye, messy formatting.',
    icon: <PenIcon className="h-6 w-6 text-white" />,
  },
  {
    title: 'Bulk Operations',
    description:
      'Move, rename, or tag entire groups of files in seconds, saving massive chunks of time.',
    icon: <LayersIcon className="h-6 w-6 text-white" />,
  },
]

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
    name: 'charlie davis',
    company: 'hitchhike.ai',
    quote:
      "the handwriting-to-text pipeline is mind-blowing. i just snap a photo of my scribbles, and everything's in obsidian!",
    avatar: "https://randomuser.me/api/portraits/men/34.jpg",
  },
  {
    name: 'joanna meek',
    company: 'futura devs',
    quote:
      'the context-aware chat has become my personal wiki—it pulls everything i need from my vault in a heartbeat.',
    avatar:
      'https://randomuser.me/api/portraits/women/56.jpg',
  },
  {
    name: 'samuel r. hodge',
    company: 'venture space',
    quote:
      "simply the best obsidian add-on i've come across. note companion keeps my vault tidy so i can focus on content creation.",
    avatar:
      "https://randomuser.me/api/portraits/men/92.jpg",
  },
]