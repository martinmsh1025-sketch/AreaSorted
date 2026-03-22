import { createUploadthing, type FileRouter } from "uploadthing/next";
import { headers } from "next/headers";
import { getAppUrl } from "@/lib/config/env";

const f = createUploadthing();

// C-4 FIX: Simple rate-limit state for upload abuse prevention.
// In production this should be Redis-backed; in-memory is sufficient for single-instance.
const uploadAttempts = new Map<string, { count: number; resetAt: number }>();
const UPLOAD_RATE_LIMIT = 20; // max uploads per window
const UPLOAD_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkUploadRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = uploadAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    uploadAttempts.set(ip, { count: 1, resetAt: now + UPLOAD_RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= UPLOAD_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

/**
 * Customer job photo uploads — used on the quote form for services
 * like waste removal, handyman, pest control where photos help
 * providers assess the job scope.
 */
export const ourFileRouter = {
  jobPhotos: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 5,
    },
  })
    .middleware(async () => {
      // C-4 FIX: While this must remain public (customers aren't logged in during quote),
      // we add origin validation and rate limiting to prevent abuse.
      const headerStore = await headers();
      const origin = headerStore.get("origin");
      const appUrl = getAppUrl();

      // Block cross-origin uploads in production
      if (origin && process.env.NODE_ENV === "production") {
        const appOrigin = new URL(appUrl).origin;
        if (origin !== appOrigin) {
          throw new Error("Upload not allowed from this origin");
        }
      }

      // Rate limit by IP
      const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim()
        || headerStore.get("x-real-ip")
        || "unknown";
      if (!checkUploadRateLimit(ip)) {
        throw new Error("Too many uploads — please try again later");
      }

      return { ip };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
