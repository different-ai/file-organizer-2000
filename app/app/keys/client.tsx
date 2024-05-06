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
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { create } from "./create";
import CheckoutButton from "@/components/ui/CheckoutButton";
import { useUser } from "@clerk/nextjs";

const APIKEYForm = () => {
  const [key, setKey] = useState<string>("");
  async function onCreate(formData: FormData) {
    const res = await create();
    // @ts-ignore
    if (res?.error) {
      // @ts-ignore
      alert(res.error);
      return;
    }
    if (res) {
      setKey(res.key?.key ?? "");
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

  const { user, isLoaded } = useUser();
  // @ts-ignore
  const isPaidUser = user?.publicMetadata.stripe?.status === "complete";

  return (
    <div className="mt-8">
      {isPaidUser ? (
        <>
          <Card className="w-[350px]">
            <CardHeader></CardHeader>
            <form action={onCreate} onSubmit={handleSubmit}>
              <CardFooter className="flex justify-between">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4"
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
          {key && key.length > 0 && (
            <>
              <Card className="w-[350px] mt-8">
                <CardContent>
                  <div className="grid items-center w-full gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Input name="name" value={key} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
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

export { APIKEYForm as UnkeyElements };
