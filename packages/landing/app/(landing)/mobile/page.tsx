import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Check, Camera, FileText, MessageSquare, Bell } from "lucide-react";
import Image from 'next/image';
import Link from "next/link";
import { BetaRequestForm } from "../components/beta-request-form";

export const metadata: Metadata = {
  title: "Note Companion Mobile - Your AI-powered Knowledge Partner with OCR",
  description:
    "Access your notes anywhere with the Note Companion mobile app. Capture text from images with our powerful OCR, manage your knowledge, and stay organized across all your devices.",
  alternates: {
    canonical: '/mobile',
  },
  openGraph: {
    title: "Note Companion Mobile - Your AI-powered Knowledge Partner with OCR",
    description:
      "Access your notes anywhere with the Note Companion mobile app. Capture text from images with our powerful OCR, manage your knowledge, and stay organized across all your devices.",
    url: '/mobile',
  },
};

export default function MobilePage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background text-gray-700">
      {/* Hero Section with OCR Highlight */}
      <div className="w-full max-w-5xl px-6 py-12 sm:py-12 lg:px-8 bg-transparent">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8">
            <Smartphone className="mx-auto h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            <span>Note Companion</span>
            <span className="text-primary block">Mobile</span>
          </h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-[1px] w-8 bg-muted-foreground/20"></div>
            <span className="text-xl text-muted-foreground/80 relative">
              your knowledge ecosystem on the go
              <svg className="absolute -bottom-[4px] left-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path 
                  d="M0,7 Q100,-1 200,7" 
                  stroke="blue" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  fill="none"
                  className="opacity-50"
                />
              </svg>
            </span>
            <div className="h-[1px] w-8 bg-muted-foreground/20"></div>
          </div>
          <p className="mt-6 text-lg leading-8">
            The Note Companion mobile app transforms how you capture and organize knowledge. With powerful OCR technology, seamless sync with Obsidian, and AI-powered organization, your notes become a truly portable knowledge ecosystem.
          </p>
          
          {/* Top CTA */}
          <div className="mt-8 mb-16 flex flex-col items-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-amber-100 text-amber-800 mb-4">
              <Bell className="h-4 w-4 mr-2" /> Coming Soon
            </div>
            <h3 className="text-xl font-semibold mb-3">Get Early Access</h3>
            <BetaRequestForm className="w-full" formId="top-beta-form" />
          </div>
          
          {/* OCR Before/After */}
          <div className="mt-12 mb-12">
            <h2 className="text-2xl font-bold mb-6">Turn Photos into Searchable Text</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="md:w-5/12 flex flex-col items-center">
                <h3 className="text-lg font-medium mb-3">Before</h3>
                <div className="relative rounded-xl overflow-hidden shadow-md">
                  <Image 
                    src="/images/before.jpg" 
                    alt="Handwritten note before OCR processing" 
                    width={300} 
                    height={400}
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white p-2 text-sm">
                    Handwritten notes
                  </div>
                </div>
              </div>
              
              <div className="hidden md:flex items-center justify-center">
                <ArrowRight className="h-8 w-8 text-primary" />
              </div>
              
              <div className="md:w-5/12 flex flex-col items-center">
                <h3 className="text-lg font-medium mb-3">After</h3>
                <div className="relative rounded-xl overflow-hidden shadow-md">
                  <Image 
                    src="/images/after.png" 
                    alt="Digitized note after OCR processing" 
                    width={300} 
                    height={400}
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white p-2 text-sm">
                    Searchable digital text
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Beta Request Signup */}
          <div className="mt-10 bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-xl border border-primary/20">
            <h3 className="text-xl font-bold mb-3">Request Beta Access</h3>
            <p className="text-muted-foreground mb-5">
              Be among the first to experience Note Companion Mobile. Sign up for early access and exclusive updates.
            </p>
            <BetaRequestForm formId="middle-beta-form" />
          </div>
          
        </div>
      </div>

      {/* App Features */}
      <div className="w-full py-24 bg-white/5 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-12 text-center">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-background/60 backdrop-blur-sm p-8 rounded-xl border border-border/40">
              <div className="mb-4 text-primary">
                <Camera className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Advanced OCR</h3>
              <p className="text-muted-foreground mb-4">
                Convert physical documents, whiteboards, and handwritten notes into perfectly formatted digital text with our state-of-the-art OCR technology.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="bg-background/60 backdrop-blur-sm p-8 rounded-xl border border-border/40">
              <div className="mb-4 text-primary">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Seamless Organization</h3>
              <p className="text-muted-foreground mb-4">
                Captured notes are automatically sorted into the right folders with relevant tags thanks to our AI organization system that integrates with your Obsidian vault.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="bg-background/60 backdrop-blur-sm p-8 rounded-xl border border-border/40">
              <div className="mb-4 text-primary">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Chat Integration</h3>
              <p className="text-muted-foreground mb-4">
                Chat with your notes on the go. Ask questions, get summaries, or modify text using our powerful AI assistant directly from your mobile device.
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Get Started Section */}
      <div className="w-full py-24 bg-white/5 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Get Started Today
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Request access to the Note Companion mobile beta and transform how you capture, organize, and interact with your knowledge.
          </p>
          
          {/* Secondary Beta Form */}
          <BetaRequestForm className="mb-8" formId="bottom-beta-form" />
          
          <p className="mt-6 text-sm text-muted-foreground">
            Will support iOS 15+ and Android 10+. <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
