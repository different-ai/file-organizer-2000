'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Settings } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="flex justify-around items-center h-16">
        <Link href="/dashboard" className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/dashboard' ? 'text-primary' : 'text-gray-500'}`}>
          <Home size={24} />
          <span className="text-xs mt-1">Tasks</span>
        </Link>
        <Link href="/dashboard/settings" className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/dashboard/settings' ? 'text-primary' : 'text-gray-500'}`}>
          <Settings size={24} />
          <span className="text-xs mt-1">Settings</span>
        </Link>
      </div>
    </nav>
  )
}