import { defineConfig } from "drizzle-kit";
import "./drizzle/envConfig";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL,

    // host: process.env.POSTGRES_HOST,
    // user: process.env.POSTGRES_USER,
    // password: process.env.POSTGRES_PASSWORD,
    // database: process.env.POSTGRES_DATABASE,
  },
});
