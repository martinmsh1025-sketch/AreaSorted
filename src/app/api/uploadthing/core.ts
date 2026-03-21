import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

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
      // Public upload — no auth required (customer is not logged in)
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      console.log("Upload complete:", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
