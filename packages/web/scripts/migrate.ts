import { resetInactiveUsers } from "../drizzle/migrations/reset-inactive-users";

async function runMigration() {
  try {
    console.log("Starting migration...");
    
    await resetInactiveUsers();
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration(); 