import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import CheckoutButton from "@/components/ui/checkout-button";
import { auth } from "@clerk/nextjs/server";
import { isPaidUser } from "@/app/actions";

export default async function UserManagement() {
  const { userId } = auth();
  const isPaid = await isPaidUser(userId);

  return (
    <div className=" top-4 right-4 flex items-center gap-4 max-w-6xl mx-auto ">
      <div className="sm:block">{!isPaid && <CheckoutButton />}</div>
      <a className="hidden sm:block" href="https://discord.gg/udQnCRFyus" target="_blank">
        <Button variant="outline" className="border whitespace-nowrap">Join our discord</Button>
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