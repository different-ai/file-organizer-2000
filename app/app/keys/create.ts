"use server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Unkey } from "@unkey/api";
export async function create(formData: FormData) {
  "use server";
  const { userId } = auth();
  if (!userId) {
    return null;
  }
  const token = process.env.UNKEY_ROOT_KEY;
  const apiId = process.env.UNKEY_API_ID;

  if (!token || !apiId) {
    return null;
  }

  const name = (formData.get("name") as string) ?? "My Awesome API";
  const unkey = new Unkey({ token });

  // Check if the user is a paid user
  const user = await clerkClient.users.getUser(userId);

  const isPaidUser =
    (user?.publicMetadata as CustomJwtSessionClaims["publicMetadata"])?.stripe
      ?.status === "complete";

  // Set the refill amount based on the user's subscription status
  const refillAmount = isPaidUser ? 15000 : 500;

  const key = await unkey.keys.create({
    name: name,
    ownerId: userId,
    apiId,
    remaining: refillAmount,
    refill: {
      interval: "monthly",
      amount: refillAmount,
    },
  });
  return { key: key.result };
}
