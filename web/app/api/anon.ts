import { auth, clerkClient } from "@clerk/nextjs/server";

// Create an anonymous user
export const createAnonymousUser = async () => {
  try {
    const user = await clerkClient().users.createUser({
      skipPasswordRequirement: true,
      skipPasswordChecks: true,
      firstName: 'Anonymous',
      lastName: 'User',
      emailAddress: [`anonymous-${Date.now()}@example.com`],
    });

    return user;
  } catch (error) {
    console.error("Error creating anonymous user:", error);
    throw error;
  }
};

// Update anonymous user's email address
export const updateAnonymousUserEmail = async (userId: string, newEmail: string) => {
  console.log("updateAnonymousUserEmail", userId, newEmail);
  try {
    const user = await clerkClient().users.getUser(userId);
    
    // Check if the user has an anonymous email
    const isAnonymous = user.emailAddresses.some(email => 
      email.emailAddress.startsWith('anonymous-') && email.emailAddress.endsWith('@example.com')
    );
    console.log("isAnonymous", isAnonymous);

    if (isAnonymous) {
      // First create the new email address
      await clerkClient().emailAddresses.createEmailAddress({
        userId: userId,
        emailAddress: newEmail,
        primary: true,
        verified: true,
      });
      console.log("created new email", newEmail);

      // Delete the old anonymous email address
      const anonymousEmail = user.emailAddresses.find(email => 
        email.emailAddress.startsWith('anonymous-') && 
        email.emailAddress.endsWith('@example.com')
      );
      console.log("anonymousEmail", anonymousEmail);
      if (anonymousEmail) {
        await clerkClient().emailAddresses.deleteEmailAddress(anonymousEmail.id);
      }

      console.log(`Updated email for user ${userId} to ${newEmail}`);
      return true;
    } else {
      console.log(`User ${userId} is not an anonymous user. Email not updated.`);
      return false;
    }
  } catch (error) {
    console.error("Error updating anonymous user email:", error);
    throw error;
  }
};
