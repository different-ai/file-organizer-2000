import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { create } from "./create";
import CheckoutButton from "@/components/ui/CheckoutButton";
import { auth, clerkClient } from "@clerk/nextjs/server";

const APIKEYForm = async () => {
  const { userId } = auth();

  // Check if the user is a paid user
  const isPaidUser = await checkPaidUser(userId);

  return (
    <div className="mt-8">
      {isPaidUser ? (
        <Card className="w-[350px]">
          <CardHeader></CardHeader>
          <form action={create}>
            <CardFooter className="flex justify-between">
              <Button type="submit" className="w-full mt-4">
                Create Key
              </Button>
            </CardFooter>
            <CardDescription>
              You'll need it to unlock File Organizer 2000 in your plugin
              settings.
            </CardDescription>
          </form>
        </Card>
      ) : (
        <div>
          <p className="text-gray-500 dark:text-gray-400">
            You need to be a paid user to create an API key.
          </p>
          <div className="mt-4">
            <CheckoutButton />
          </div>
        </div>
      )}
    </div>
  );
};

async function checkPaidUser(userId: string | null): Promise<boolean> {
  "use server";
  if (!userId) {
    return false;
  }

  try {
    const user = await clerkClient.users.getUser(userId);

    const isPaidUser =
      (user?.publicMetadata as CustomJwtSessionClaims["publicMetadata"])?.stripe
        ?.status === "complete";
    return isPaidUser;
  } catch (error) {
    console.error("Error checking paid user status:", error);
  }

  return false;
}

export default APIKEYForm;
