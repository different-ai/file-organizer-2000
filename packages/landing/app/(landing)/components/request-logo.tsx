'use client';

import Image from 'next/image';

export const RequestLogo = ({ className }: { className?: string }) => (
  <Image 
    src="/request-req-logo.png" 
    alt="Request Network" 
    width={32} 
    height={32} 
    className={className}
  />
); 