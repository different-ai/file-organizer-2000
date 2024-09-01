"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { create, isPaidUser } from "../actions";
import CheckoutButton from "@/components/ui/CheckoutButton";
import { useUser } from "@clerk/nextjs";

const LicenseForm = () => {
  const [licenseKey, setLicenseKey] = useState<string>("");
  const [isPaid, setIsPaid] = useState(false);
  async function onCreate(formData: FormData) {
    const res = await create();
    // @ts-ignore
    if (res?.error) {
      // @ts-ignore
      alert(res.error);
      return;
    }
    if (res) {
      setLicenseKey(res.key?.key ?? "");
    }
  }
  const [loading, setLoading] = useState(false);
  // Show loading state in UI while key is being generated
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await onCreate(new FormData(event.target as HTMLFormElement));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const { user } = useUser();

  useEffect(() => {
    const handleSetIsPaidUser = async () => {
      if (!user) return;
      const isPaid = await isPaidUser(user.id);
      setIsPaid(isPaid);
    };
    handleSetIsPaidUser();
  }, [user]);

  return (
    // center elements
    <div className="mt-8 flex flex-col items-center justify-center">
      {isPaid ? (
        <>
          <Card className="w-[350px] ">
            <CardHeader></CardHeader>
            <form action={onCreate} onSubmit={handleSubmit}>
              <CardFooter className="flex justify-center">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 "
                >
                  {loading ? "Generating Key..." : "Create Key"}{" "}
                </Button>{" "}
              </CardFooter>
              <CardDescription>
                You'll need it to unlock File Organizer 2000 in your plugin
                settings.
              </CardDescription>
            </form>
          </Card>
          {licenseKey && licenseKey.length > 0 && (
            <>
              <Card className="w-[350px] mt-8 rounded-lg">
                <CardContent>
                  <div className="grid items-center w-full gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Input name="name" value={licenseKey} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      ) : (
        <div>
          <h1 className="text-gray-800 text-5xl font-extrabold dark:text-gray-500">
            Become a Pro user
          </h1>
          <div className="mt-6">
            <CheckoutButton />
          </div>
        </div>
      )}
    </div>
  );
};

export { LicenseForm };
