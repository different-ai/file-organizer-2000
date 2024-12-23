import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

async function createAccountAndPurchase() {
  const stagehand = new Stagehand({
    env: "LOCAL",
    headless: false,
  });

  // Generate a random email suffix for testing
  const randomSuffix = Math.floor(Math.random() * 10000);
  const email = `benjamin.shafii+test${randomSuffix}@gmail.com`;

  try {
    await stagehand.init();

    // Navigate to the onboarding page
    await stagehand.page.goto("https://file-organizer-2000-git-billing-test-prologe.vercel.app/dashboard/onboarding");

    // act click on signup button
    await stagehand.act({
      action: "click on the signup button"
    });

    // Create account
    await stagehand.act({
      action: "enter %email% into the email field",
      variables: { email }
    });

    await stagehand.act({
      action: "enter a complicated 12 character password into the password field",
    });

    await stagehand.act({
      action: "click the sign up or create account button"
    });


    await stagehand.act({
      action: "Under File Organizer 2000 - Cloud click on the get started button"
    });

    // Fill out payment form
    await stagehand.act({
      action: "enter %cardNumber% into the card number field",
      variables: {
        cardNumber: "4242424242424242"
      }
    });

    await stagehand.act({
      action: "enter %expiry% into the expiration date field",
      variables: {
        expiry: "1234"  // 12/34
      }
    });

    await stagehand.act({
      action: "enter %cvc% into the CVC field",
      variables: {
        cvc: "123"
      }
    });

    // Submit the form
    await stagehand.act({
      action: "click the purchase or submit button"
    });


    // click on "create key" and copy the api key
    await stagehand.act({
      action: "click on the create key button"
    });

    const apiKey = await stagehand.extract({
      instruction: "extract the api key",
      schema: z.object({
        apiKey: z.string()
      })
    });
    console.log("API Key:", apiKey);

    console.log("Account created with email:", email);

  } catch (error) {
    console.error("Error during account creation or purchase:", error);
  } finally {
    await stagehand.close();
  }
}

createAccountAndPurchase();
