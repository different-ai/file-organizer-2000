import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * v0 by Vercel.
 * @see https://v0.dev/t/3zYKBzoNSWf
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
export default function Component() {
  return (
    <section className="w-full py-6 md:py-12 lg:py-16">
      <div className="container flex flex-col items-center gap-4 px-4 md:px-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Thank you for your purchase
          </h1>
          <p className="text-gray-500 md:text-xl dark:text-gray-400">
            Your support means the world to us. You now have access to all early
            access features!
          </p>
          <div className="mt-12">
            <Link href="/">
              <Button>Go back to dashboard</Button>
            </Link>
          </div>
        </div>
        <div className="aspect-w-16 aspect-h-9 w-full max-w-3xl rounded-lg overflow-hidden" />
      </div>
    </section>
  );
}
