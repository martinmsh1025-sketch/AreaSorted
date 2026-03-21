import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  seed: {
    command: `node ${path.resolve("prisma/seed.cjs")}`,
  },
});
