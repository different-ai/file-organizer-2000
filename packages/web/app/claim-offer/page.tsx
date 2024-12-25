import Image from 'next/image';
import { ClaimButton } from './claim-button';

export default function ClaimOfferPage() {
  return (
    <div className="max-w-md mx-auto p-6 mt-8 text-center space-y-6">
      <h1 className="text-2xl font-bold">Free 5M Token Offer</h1>
      <p>Thank you for supporting File Organizer. Here's $15 worth of credits on us!</p>
      <Image
        src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWEwczVwdG40NzE1eG41ZzNwY3o2ZGk4c3lnN3ViMzcwcmk0Y202aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/sZjZz0NjdQuOdjPmGY/giphy.webp"
        alt="Christmas GIF"
        width={300}
        height={180}
      />
      <ClaimButton />
    </div>
  );
}
