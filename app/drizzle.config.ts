import { defineConfig } from 'drizzle-kit';
import './drizzle/envConfig';


export default defineConfig({
  schema: './drizzle/schema.ts',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL!,
  },
});