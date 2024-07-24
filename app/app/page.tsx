import CheckoutButton from "@/components/ui/CheckoutButton";
import { UnkeyElements } from "./keys/client";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { auth, clerkClient } from "@clerk/nextjs/server";
import FolderSelector from "@/components/ui/FolderSelection";
import Logo from "@/components/ui/logo";
async function UserManagement() {
  const { userId } = auth();
  const user = await clerkClient.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  const isPaidUser =
    (user?.publicMetadata as CustomJwtSessionClaims["publicMetadata"])?.stripe
      ?.status === "complete";

  return (
    <div className="absolute top-4 right-4 flex items-center gap-4">
      {!isPaidUser && <CheckoutButton />}
      <a href="https://discord.gg/udQnCRFyus" target="_blank">
        <Button className="border ">Join our discord</Button>
      </a>
      {isPaidUser && (
        <a href={process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL}>
          <Button variant="secondary">Manage Subscription</Button>
        </a>
      )}

      <div className="text-sm text-gray-500">{email}</div>
      <UserButton />
    </div>
  );
}

export default async function Component() {
  if (process.env.USE_STANDALONE === "true") {
    return <FolderSelector />;
  }

  return (
    <div className="flex min-h-screen py-7 px-4 sm:px-6 lg:px-8 flex-col">
      <div className="flex-1 mb-8 flex items-center justify-center pt-16">
        <div className="flex flex-col lg:flex-row w-full max-w-6xl">
          <div className="relative w-full sm:hidden md:block lg:w-1/2 rounded-lg overflow-hidden aspect-video mb-8 lg:mb-0">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/XZTpbECqZps?controls=0?modestbranding=1?showinfo=0"
              frameBorder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <div className="flex-1 space-y-8 flex flex-col justify-center lg:pl-8">
            <div className="text-center flex flex-col justify-center items-center">
              {process.env.ENABLE_USER_MANAGEMENT == "true" ? (
                <UnkeyElements />
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
