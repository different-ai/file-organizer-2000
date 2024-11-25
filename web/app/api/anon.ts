import { auth, clerkClient } from "@clerk/nextjs/server";

// Create an anonymous user
export const createAnonymousUser = async () => {
  try {
    const user = await clerkClient.users.createUser({
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
