ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'COMPLETED_PENDING_CUSTOMER';

ALTER TABLE "Booking"
ADD COLUMN "providerCompletedAt" TIMESTAMP(3),
ADD COLUMN "customerCompletedAt" TIMESTAMP(3),
ADD COLUMN "autoCompletedAt" TIMESTAMP(3),
ADD COLUMN "completionConfirmedAt" TIMESTAMP(3),
ADD COLUMN "completionConfirmationDeadlineAt" TIMESTAMP(3);
