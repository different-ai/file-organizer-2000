import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Header() {
  return (
    <header className="py-4 px-6 flex items-center justify-between border-b border-[var(--border-color-light)]">
      <div className="flex items-center space-x-8">
        <Link href="#features" className="mono text-sm">Features</Link>
        <Link href="#pricing" className="mono text-sm">Pricing</Link>
        <Link href="#faq" className="mono text-sm">FAQ</Link>
      </div>
      <Button 
        className="bg-[var(--highlight-color)] text-[var(--font-color)] hover:opacity-90 transition-opacity"
        onClick={() => window.location.href = 'https://app.fileorganizer2000.com'}
      >
        Start Free Trial
      </Button>
    </header>
  )
}

