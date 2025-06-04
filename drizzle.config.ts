import { defineConfig } from "drizzle-kit";
import { readConfig } from "./src/config.ts"

export default defineConfig({
  schema: "src/db",
  out: "src/db",
  dialect: "postgresql",
  dbCredentials: {
    url: readConfig()!.dbUrl,
  },
});