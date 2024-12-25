import Image from 'next/image';
import { ClaimButton } from './claim-button';

export default function ClaimOfferPage() {
  return (
    <div className="max-w-md mx-auto p-6 mt-8 text-center space-y-6">
      <h1 className="text-2xl font-bold">Free 5M Token Offer</h1>
      <p>Thank you for supporting File Organizer. Here's $15 worth of credits on us!</p>
      <Image
        src="https://i.giphy.com/sZjZz0NjdQuOdjPmGY.webp"
        alt="Christmas GIF"
        width={300}
        height={180}
      />
      <ClaimButton />
    </div>
  );
}
