import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // @ts-expect-error Prisma 6 seed config — types not yet updated
  seed: {
    command: `node ${path.resolve("prisma/seed.cjs")}`,
  },
});
