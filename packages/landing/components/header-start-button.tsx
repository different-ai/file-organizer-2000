'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

// Campaign pages (/obsidian) have a single install CTA, so the sign-up shortcut is hidden there.
const HIDDEN_ON = ['/obsidian'];

export function HeaderStartButton() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <Link href="https://accounts.notecompanion.ai/sign-up">
      <Button variant="default" size="sm">
        Start
      </Button>
    </Link>
  );
}
