import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Note Companion DAO - Community Owned Development",
  description:
    "Join the Note Companion DAO to help shape the future of the project, receive rewards for contributions, and participate in community governance.",
};

export default function DaoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background">
      <div className="w-full max-w-4xl px-6 py-12">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>
        
        <h1 className="text-4xl font-bold tracking-tight mb-8">Note Companion DAO</h1>
        
        <div className="prose max-w-none">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Why We're Creating a DAO</h2>
          <p className="text-gray-700 mb-6">
            Note Companion has grown from a simple organization tool to a community of passionate note-takers
            and knowledge workers. To ensure this project continues to grow in a direction that serves the
            community, we're transitioning to a Decentralized Autonomous Organization (DAO) model.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Vision</h2>
          <p className="text-gray-700 mb-6">
            We believe the future of Note Companion should be guided by the people who use and love it most.
            The DAO structure enables us to:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li className="text-gray-700">
              <strong>Better serve our community</strong> - Direct input from token holders on feature priorities and development direction
            </li>
            <li className="text-gray-700">
              <strong>Reward early supporters</strong> - Token holders receive special benefits, discounts, and future airdrops
            </li>
            <li className="text-gray-700">
              <strong>Expand beyond Obsidian</strong> - Community governance to guide expansion to other platforms and integrations
            </li>
            <li className="text-gray-700">
              <strong>Ensure long-term sustainability</strong> - Community ownership means the project isn't dependent on any single developer
            </li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">How It Works</h2>
          <p className="text-gray-700 mb-6">
            The Note Companion DAO operates through a token-based governance system:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li className="text-gray-700">
              <strong>Token Distribution</strong> - Tokens are distributed to early supporters, contributors, and through future community initiatives
            </li>
            <li className="text-gray-700">
              <strong>Voting Rights</strong> - Token holders can vote on proposals for new features, integrations, and other project decisions
            </li>
            <li className="text-gray-700">
              <strong>Community Benefits</strong> - Token holders receive special pricing, early access to new features, and exclusive airdrops
            </li>
            <li className="text-gray-700">
              <strong>Transparent Governance</strong> - All proposals and voting are publicly visible and auditable
            </li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Get Involved</h2>
          <p className="text-gray-700 mb-6">
            There are several ways to participate in the Note Companion DAO:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-2">Join Our Community</h3>
              <p className="text-gray-700 mb-4">
                Connect with other Note Companion enthusiasts and stay updated on DAO developments.
              </p>
              <div className="space-y-2">
                <a 
                  href="https://t.me/notecompanion" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  → Join our Telegram
                </a>
                <a 
                  href="https://x.com/notecompanion" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  → Follow on Twitter
                </a>
              </div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-2">View on daos.fun</h3>
              <p className="text-gray-700 mb-4">
                Check out our DAO page to see current proposals, token information, and governance details.
              </p>
              <a 
                href="https://www.daos.fun/dao/8iLdHtnZL3aLVRVseT1Rv3cytngqPPoe2hWcouJLd8Gd" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-blue-600 hover:underline"
              >
                → View Note Companion DAO
              </a>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Roadmap</h2>
          <p className="text-gray-700 mb-6">
            Our journey to a fully community-owned project will unfold in several phases:
          </p>
          
          <ol className="list-decimal pl-6 space-y-4 mb-8">
            <li className="text-gray-700">
              <strong>Phase 1: Community Building</strong> - Growing our Telegram and social media presence to establish a strong community foundation
            </li>
            <li className="text-gray-700">
              <strong>Phase 2: Initial Token Distribution</strong> - Distributing tokens to early supporters and contributors
            </li>
            <li className="text-gray-700">
              <strong>Phase 3: Governance Structure</strong> - Implementing voting mechanisms and proposal systems
            </li>
            <li className="text-gray-700">
              <strong>Phase 4: Expanded Development</strong> - Community-driven expansion to new platforms and integrations
            </li>
          </ol>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-medium mb-2">Stay Updated</h3>
            <p className="text-gray-700 mb-4">
              This is just the beginning of our journey. Join our community channels to stay informed about the latest developments, token distributions, and governance opportunities.
            </p>
            <Link href="https://t.me/notecompanion">
              <Button className="bg-primary text-white hover:bg-primary/90">
                Join Our Telegram
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}