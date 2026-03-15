import { PrismaClient } from "@prisma/client";
import { requireEnv, getEnv } from "@/lib/config/env";

declare global {
  var __areasortedPrisma__: PrismaClient | undefined;
}

function createPrismaClient() {
  const env = getEnv();

  return new PrismaClient({
    datasources: {
      db: {
        url: String(requireEnv("DATABASE_URL")),
      },
    },
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export function getPrisma() {
  if (!globalThis.__areasortedPrisma__) {
    globalThis.__areasortedPrisma__ = createPrismaClient();
  }

  return globalThis.__areasortedPrisma__;
}
