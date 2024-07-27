import CheckoutButton from "@/components/ui/CheckoutButton";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { LicenseForm } from "./components/LicenseForm";
import { isPaidUser } from "./actions";

async function UserManagement() {
  const { userId } = auth();
  const isPaid = await isPaidUser(userId);

  return (
    <div className="absolute top-4 right-4 flex items-center gap-4">
      <div className="hidden sm:block">{!isPaid && <CheckoutButton />}</div>
      <a href="https://discord.gg/udQnCRFyus" target="_blank">
        <Button className="border whitespace-nowrap">Join our discord</Button>
      </a>
      {isPaid && (
        <a href={process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL}>
          <Button variant="secondary">Subscription</Button>
        </a>
      )}
      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
        <UserButton />
      </div>
    </div>
  );
}

export default async function Component() {
  return (
    <div className="flex min-h-screen py-7 px-4 sm:px-6 lg:px-8 flex-col">
      <div className="flex-1 mb-8 flex items-center justify-center pt-16">
        <div className="flex flex-col lg:flex-row w-full max-w-6xl">
          <div className="w-full lg:w-1/2 rounded-lg overflow-hidden aspect-video mb-8 lg:mb-0">
            <iframe
              className="w-full h-full hidden md:block"
              src="https://www.youtube.com/embed/XZTpbECqZps?controls=0&modestbranding=1&showinfo=0"
              frameBorder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <iframe
              width="560"
              height="315"
              src="https://www.youtube.com/embed/videoseries?list=PLgRcC-DFR5jdUxbSBuNeymwYTH_FSVxio"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
          <div className="flex-1 space-y-8 flex flex-col justify-center lg:pl-8">
            <div className="text-center flex flex-col justify-center items-center">
              {process.env.ENABLE_USER_MANAGEMENT == "true" ? (
                <LicenseForm />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 px-4">
                  Just paste this URL in the plugin settings in Obsidian and
                  you're good to go!
                </p>
              )}
            </div>
            <div className="text-center">
              <ArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-800 mt-6 text-xl sm:text-2xl font-extrabold mt-2 mb-4">
                Get the plugin
              </p>

              <a href="obsidian://show-plugin?id=fileorganizer2000">
                <Button className="max-w-xs w-full sm:w-auto">Download</Button>
              </a>
              <p className="mt-3 text-sm text-gray-600">
                Requires Obsidian app.
              </p>
            </div>
          </div>
        </div>
      </div>
      {process.env.ENABLE_USER_MANAGEMENT == "true" ? (
        <UserManagement />
      ) : (
        <></>
      )}
    </div>
  );
}
function ArrowDownIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}
