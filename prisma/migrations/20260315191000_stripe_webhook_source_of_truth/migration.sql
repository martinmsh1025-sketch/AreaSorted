-- CreateEnum
CREATE TYPE "WebhookProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED');

-- AlterTable
ALTER TABLE "WebhookEvent"
ADD COLUMN "status" "WebhookProcessingStatus" NOT NULL DEFAULT 'RECEIVED';
