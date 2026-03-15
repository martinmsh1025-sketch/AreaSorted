-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'OPS_ADMIN', 'REVIEWER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CleanerStatus" AS ENUM ('NEW', 'PENDING_DOCS', 'UNDER_REVIEW', 'APPROVED', 'CONTRACT_SENT', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApplicationSource" AS ENUM ('INDEED', 'WEBSITE', 'REFERRAL', 'FACEBOOK', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'PENDING_DOCS', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'MORE_INFO_REQUIRED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID', 'CV', 'PHOTO', 'RIGHT_TO_WORK', 'ADDRESS_PROOF', 'DBS');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REUPLOAD');

-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('INITIAL_REVIEW', 'RECHECK', 'MANUAL_OVERRIDE');

-- CreateEnum
CREATE TYPE "ReviewOutcome" AS ENUM ('APPROVED', 'REJECTED', 'MORE_INFO_REQUIRED');

-- CreateEnum
CREATE TYPE "ContractProvider" AS ENUM ('DOCUSIGN');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'SIGNED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('NONE', 'PUBLIC_TRANSPORT', 'CAR', 'BIKE', 'WALK');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'GENERATED', 'EXPIRED', 'CONVERTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('REGULAR_CLEANING', 'DEEP_CLEANING', 'OFFICE_CLEANING', 'AIRBNB_TURNOVER', 'END_OF_TENANCY');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('FLAT', 'HOUSE', 'OFFICE', 'STUDIO', 'OTHER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('AWAITING_PAYMENT', 'PAID', 'PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_CLEANER_FOUND', 'REFUND_PENDING', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "RefundType" AS ENUM ('FULL', 'PARTIAL');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('CREATED', 'OFFERING', 'ASSIGNED', 'ACCEPTED', 'CANCELLED_BY_CLEANER', 'CANCELLED_BY_CUSTOMER', 'NO_SHOW', 'NO_CLEANER_FOUND', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OfferChannel" AS ENUM ('WHATSAPP', 'SMS', 'EMAIL');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('ADMIN', 'SYSTEM', 'CUSTOMER', 'CLEANER');

-- CreateEnum
CREATE TYPE "ScoreEventType" AS ENUM ('JOB_COMPLETED', 'LATE_CANCEL', 'COMPLAINT_UPHELD', 'NO_SHOW', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'UPHELD', 'REJECTED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ComplaintType" AS ENUM ('POOR_QUALITY', 'LATE_ARRIVAL', 'MISSED_TASKS', 'INAPPROPRIATE_BEHAVIOUR', 'DAMAGE_CLAIM', 'NO_SHOW', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationRelatedType" AS ENUM ('APPLICATION', 'BOOKING', 'JOB', 'COMPLAINT', 'REFUND');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('CUSTOMER', 'CLEANER', 'ADMIN');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'DELIVERED', 'READ');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProviderCompanyStatus" AS ENUM ('INVITED', 'PROFILE_STARTED', 'AGREEMENT_SIGNED', 'STRIPE_PENDING', 'STRIPE_RESTRICTED', 'STRIPE_ACTIVE', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ConnectAccountMode" AS ENUM ('EXPRESS', 'STANDARD', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ChargeModel" AS ENUM ('DIRECT_CHARGES', 'DESTINATION_CHARGES', 'SEPARATE_CHARGES_AND_TRANSFERS');

-- CreateEnum
CREATE TYPE "InvoiceStrategy" AS ENUM ('PROVIDER_SERVICE_PLUS_PLATFORM_FEE_RECEIPT', 'COMBINED_CUSTOMER_RECEIPT');

-- CreateEnum
CREATE TYPE "RefundLiability" AS ENUM ('PROVIDER', 'PLATFORM', 'SHARED');

-- CreateEnum
CREATE TYPE "DisputeCaseStatus" AS ENUM ('OPEN', 'NEEDS_EVIDENCE', 'SUBMITTED', 'WON', 'LOST', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProviderPayoutStatus" AS ENUM ('PENDING', 'CREATED', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LedgerEntryKind" AS ENUM ('BOOKING_CREATED', 'PAYMENT_SUCCEEDED', 'APPLICATION_FEE_RECOGNIZED', 'REFUND_CREATED', 'REFUND_SUCCEEDED', 'DISPUTE_OPENED', 'DISPUTE_WON', 'DISPUTE_LOST', 'PAYOUT_CREATED', 'PAYOUT_PAID', 'PAYOUT_FAILED', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "WebhookProvider" AS ENUM ('STRIPE');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" "AdminRole" NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAddress" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "label" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "county" TEXT,
    "entryNotes" TEXT,
    "parkingNotes" TEXT,
    "hasPets" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cleaner" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "profilePhotoPath" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "nationality" TEXT,
    "rightToWorkStatus" TEXT,
    "dbsStatus" TEXT,
    "utrNumber" TEXT,
    "niNumber" TEXT,
    "hasOwnSupplies" BOOLEAN NOT NULL DEFAULT false,
    "hasOwnEquipment" BOOLEAN NOT NULL DEFAULT false,
    "transportMode" "TransportMode" NOT NULL DEFAULT 'NONE',
    "bio" TEXT,
    "spokenLanguages" TEXT[],
    "status" "CleanerStatus" NOT NULL DEFAULT 'NEW',
    "scoreCurrent" INTEGER NOT NULL DEFAULT 100,
    "scoreRankBucket" TEXT,
    "acceptedTermsAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cleaner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerApplication" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "source" "ApplicationSource" NOT NULL,
    "sourceReference" TEXT,
    "yearsExperience" INTEGER,
    "cleaningTypes" "ServiceType"[],
    "canWorkWeekends" BOOLEAN NOT NULL DEFAULT false,
    "canWorkEvenings" BOOLEAN NOT NULL DEFAULT false,
    "wantsRegularJobs" BOOLEAN NOT NULL DEFAULT true,
    "wantsOneOffJobs" BOOLEAN NOT NULL DEFAULT true,
    "dbsWillingToPay" BOOLEAN NOT NULL DEFAULT false,
    "notesFromApplicant" TEXT,
    "applicationStatus" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3),
    "reviewStartedAt" TIMESTAMP(3),
    "reviewCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerDocument" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileMimeType" TEXT,
    "fileSize" INTEGER,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "expiryDate" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByAdminId" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerVerificationReview" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "reviewType" "ReviewType" NOT NULL,
    "idVerified" BOOLEAN NOT NULL DEFAULT false,
    "rtwVerified" BOOLEAN NOT NULL DEFAULT false,
    "addressVerified" BOOLEAN NOT NULL DEFAULT false,
    "cvReviewed" BOOLEAN NOT NULL DEFAULT false,
    "photoReviewed" BOOLEAN NOT NULL DEFAULT false,
    "dbsReviewed" BOOLEAN NOT NULL DEFAULT false,
    "outcome" "ReviewOutcome" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleanerVerificationReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerContract" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "contractVersion" TEXT NOT NULL,
    "provider" "ContractProvider" NOT NULL,
    "providerEnvelopeId" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "signedFilePath" TEXT,
    "sentAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerAvailabilityRule" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerAvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerUnavailableDate" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleanerUnavailableDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerServiceArea" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "postcodePrefix" TEXT NOT NULL,
    "radiusMiles" DOUBLE PRECISION,
    "isPrimaryArea" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerScore" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "currentScore" INTEGER NOT NULL DEFAULT 100,
    "lifetimeCompletedJobs" INTEGER NOT NULL DEFAULT 0,
    "lifetimeCancelledJobs" INTEGER NOT NULL DEFAULT 0,
    "lifetimeNoShows" INTEGER NOT NULL DEFAULT 0,
    "lifetimeUpheldComplaints" INTEGER NOT NULL DEFAULT 0,
    "lastScoreChangeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleanerScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerScoreLog" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "bookingId" TEXT,
    "jobId" TEXT,
    "eventType" "ScoreEventType" NOT NULL,
    "scoreDelta" INTEGER NOT NULL,
    "scoreBefore" INTEGER NOT NULL,
    "scoreAfter" INTEGER NOT NULL,
    "reason" TEXT,
    "createdByType" "ActorType" NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleanerScoreLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "bedroomCount" INTEGER,
    "bathroomCount" INTEGER,
    "estimatedHours" DECIMAL(5,2) NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "customerProvidesSupplies" BOOLEAN NOT NULL DEFAULT false,
    "preferredDate" TIMESTAMP(3),
    "preferredTime" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringFrequency" TEXT,
    "additionalNotes" TEXT,
    "baseAmount" DECIMAL(10,2) NOT NULL,
    "addonsAmount" DECIMAL(10,2) NOT NULL,
    "surchargeAmount" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "quoteStatus" "QuoteStatus" NOT NULL DEFAULT 'GENERATED',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteAddon" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "addonCode" TEXT NOT NULL,
    "addonName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT,
    "customerId" TEXT NOT NULL,
    "customerAddressId" TEXT,
    "providerCompanyId" TEXT,
    "serviceAddressLine1" TEXT NOT NULL,
    "serviceAddressLine2" TEXT,
    "serviceCity" TEXT NOT NULL,
    "servicePostcode" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "bedroomCount" INTEGER,
    "bathroomCount" INTEGER,
    "serviceType" "ServiceType" NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledStartTime" TEXT NOT NULL,
    "scheduledEndTime" TEXT,
    "durationHours" DECIMAL(5,2) NOT NULL,
    "customerProvidesSupplies" BOOLEAN NOT NULL DEFAULT false,
    "additionalNotes" TEXT,
    "bookingStatus" "BookingStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "rescheduleCount" INTEGER NOT NULL DEFAULT 0,
    "cancelledByType" "ActorType",
    "cancelledReason" TEXT,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "cleanerPayoutAmount" DECIMAL(10,2),
    "platformMarginAmount" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAddon" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "addonCode" TEXT NOT NULL,
    "addonName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerPaymentIntentId" TEXT,
    "providerChargeId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "amount" DECIMAL(10,2) NOT NULL,
    "feeAmount" DECIMAL(10,2),
    "netAmount" DECIMAL(10,2),
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "providerRefundId" TEXT,
    "refundReason" TEXT,
    "refundType" "RefundType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "processedByAdminId" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "jobStatus" "JobStatus" NOT NULL DEFAULT 'CREATED',
    "dispatchRound" INTEGER NOT NULL DEFAULT 1,
    "assignmentDeadlineAt" TIMESTAMP(3),
    "assignedCleanerId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOffer" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "offerChannel" "OfferChannel" NOT NULL,
    "offerStatus" "OfferStatus" NOT NULL DEFAULT 'SENT',
    "responseDeadlineAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobAssignment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "assignmentStatus" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCancellation" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "cleanerId" TEXT,
    "cancelledByType" "ActorType" NOT NULL,
    "hoursBeforeStart" DECIMAL(6,2),
    "within48Hours" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "scorePenaltyApplied" INTEGER,
    "adminNotifiedEmail" BOOLEAN NOT NULL DEFAULT false,
    "adminNotifiedSms" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobCancellation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "jobId" TEXT,
    "customerId" TEXT NOT NULL,
    "cleanerId" TEXT,
    "complaintType" "ComplaintType" NOT NULL,
    "description" TEXT NOT NULL,
    "attachmentPath" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "refundAmount" DECIMAL(10,2),
    "scorePenalty" INTEGER,
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "relatedType" "NotificationRelatedType" NOT NULL,
    "relatedId" TEXT NOT NULL,
    "recipientType" "RecipientType" NOT NULL,
    "recipientId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "templateCode" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "subject" TEXT,
    "bodyPreview" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "providerName" TEXT,
    "providerStatus" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "heroHeading" TEXT,
    "heroSubheading" TEXT,
    "contentBlocks" JSONB,
    "faqBlocks" JSONB,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoLandingPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "headline" TEXT,
    "bodyContent" TEXT,
    "faqContent" JSONB,
    "canonicalUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoLandingPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCompany" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "legalName" TEXT NOT NULL,
    "tradingName" TEXT,
    "companyNumber" TEXT NOT NULL,
    "registeredAddress" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vatNumber" TEXT,
    "insuranceExpiry" TIMESTAMP(3),
    "complianceNotes" TEXT,
    "status" "ProviderCompanyStatus" NOT NULL DEFAULT 'INVITED',
    "paymentReady" BOOLEAN NOT NULL DEFAULT false,
    "stripeRequirementsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderServiceCategory" (
    "id" TEXT NOT NULL,
    "providerCompanyId" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProviderServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCoverageArea" (
    "id" TEXT NOT NULL,
    "providerCompanyId" TEXT NOT NULL,
    "postcodePrefix" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProviderCoverageArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderPricingRule" (
    "id" TEXT NOT NULL,
    "providerCompanyId" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "serviceKey" TEXT NOT NULL,
    "pricingMode" TEXT NOT NULL,
    "flatPrice" DECIMAL(10,2),
    "hourlyPrice" DECIMAL(10,2),
    "minimumCharge" DECIMAL(10,2),
    "travelFee" DECIMAL(10,2),
    "sameDayUplift" DECIMAL(10,2),
    "weekendUplift" DECIMAL(10,2),
    "customQuoteRequired" BOOLEAN NOT NULL DEFAULT false,
    "pricingJson" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderInvite" (
    "id" TEXT NOT NULL,
    "providerCompanyId" TEXT,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderAgreement" (
    "id" TEXT NOT NULL,
    "providerCompanyId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "documentUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeConnectedAccount" (
    "id" TEXT NOT NULL,
    "providerCompanyId" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "mode" "ConnectAccountMode" NOT NULL DEFAULT 'EXPRESS',
    "chargeModel" "ChargeModel" NOT NULL DEFAULT 'DIRECT_CHARGES',
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "requirementsJson" JSONB,
    "onboardingUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeConnectedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPriceSnapshot" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "providerServiceAmount" DECIMAL(10,2) NOT NULL,
    "platformBookingFee" DECIMAL(10,2) NOT NULL,
    "platformCommissionAmount" DECIMAL(10,2) NOT NULL,
    "platformMarkupAmount" DECIMAL(10,2) NOT NULL,
    "optionalExtrasAmount" DECIMAL(10,2) NOT NULL,
    "customerTotalAmount" DECIMAL(10,2) NOT NULL,
    "providerExpectedPayout" DECIMAL(10,2) NOT NULL,
    "pricingJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingPriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "stripeAccountId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "stripeBalanceTransactionId" TEXT,
    "paymentState" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "grossAmount" DECIMAL(10,2) NOT NULL,
    "applicationFeeAmount" DECIMAL(10,2),
    "stripeFeeEstimate" DECIMAL(10,2),
    "stripeFeeActual" DECIMAL(10,2),
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundRecord" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentRecordId" TEXT,
    "stripeRefundId" TEXT,
    "refundReason" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "liability" "RefundLiability" NOT NULL DEFAULT 'PLATFORM',
    "refundApplicationFee" BOOLEAN NOT NULL DEFAULT false,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeRecord" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "providerCompanyId" TEXT,
    "stripeDisputeId" TEXT,
    "status" "DisputeCaseStatus" NOT NULL DEFAULT 'OPEN',
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "evidenceJson" JSONB,
    "platformAbsorbsLoss" BOOLEAN NOT NULL DEFAULT false,
    "recoverableFromProvider" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisputeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutRecord" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "providerCompanyId" TEXT NOT NULL,
    "stripePayoutId" TEXT,
    "status" "ProviderPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(10,2) NOT NULL,
    "availableOn" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "kind" "LedgerEntryKind" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "description" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceRecord" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "providerCompanyId" TEXT,
    "number" TEXT NOT NULL,
    "strategy" "InvoiceStrategy" NOT NULL,
    "issuer" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "pdfUrl" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLogV2" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "providerCompanyId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "templateCode" TEXT,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLogV2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "WebhookProvider" NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "payloadJson" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_stripeCustomerId_key" ON "Customer"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "CustomerAddress_customerId_idx" ON "CustomerAddress"("customerId");

-- CreateIndex
CREATE INDEX "CustomerAddress_postcode_idx" ON "CustomerAddress"("postcode");

-- CreateIndex
CREATE UNIQUE INDEX "Cleaner_email_key" ON "Cleaner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cleaner_phone_key" ON "Cleaner"("phone");

-- CreateIndex
CREATE INDEX "Cleaner_status_idx" ON "Cleaner"("status");

-- CreateIndex
CREATE INDEX "Cleaner_postcode_idx" ON "Cleaner"("postcode");

-- CreateIndex
CREATE INDEX "Cleaner_scoreCurrent_idx" ON "Cleaner"("scoreCurrent");

-- CreateIndex
CREATE INDEX "CleanerApplication_cleanerId_idx" ON "CleanerApplication"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerApplication_source_idx" ON "CleanerApplication"("source");

-- CreateIndex
CREATE INDEX "CleanerApplication_applicationStatus_idx" ON "CleanerApplication"("applicationStatus");

-- CreateIndex
CREATE INDEX "CleanerDocument_cleanerId_idx" ON "CleanerDocument"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerDocument_documentType_idx" ON "CleanerDocument"("documentType");

-- CreateIndex
CREATE INDEX "CleanerDocument_verificationStatus_idx" ON "CleanerDocument"("verificationStatus");

-- CreateIndex
CREATE INDEX "CleanerVerificationReview_cleanerId_idx" ON "CleanerVerificationReview"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerVerificationReview_adminUserId_idx" ON "CleanerVerificationReview"("adminUserId");

-- CreateIndex
CREATE INDEX "CleanerContract_cleanerId_idx" ON "CleanerContract"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerContract_status_idx" ON "CleanerContract"("status");

-- CreateIndex
CREATE INDEX "CleanerAvailabilityRule_cleanerId_idx" ON "CleanerAvailabilityRule"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerAvailabilityRule_dayOfWeek_idx" ON "CleanerAvailabilityRule"("dayOfWeek");

-- CreateIndex
CREATE INDEX "CleanerUnavailableDate_cleanerId_idx" ON "CleanerUnavailableDate"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerUnavailableDate_date_idx" ON "CleanerUnavailableDate"("date");

-- CreateIndex
CREATE INDEX "CleanerServiceArea_cleanerId_idx" ON "CleanerServiceArea"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerServiceArea_postcodePrefix_idx" ON "CleanerServiceArea"("postcodePrefix");

-- CreateIndex
CREATE UNIQUE INDEX "CleanerScore_cleanerId_key" ON "CleanerScore"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerScoreLog_cleanerId_idx" ON "CleanerScoreLog"("cleanerId");

-- CreateIndex
CREATE INDEX "CleanerScoreLog_bookingId_idx" ON "CleanerScoreLog"("bookingId");

-- CreateIndex
CREATE INDEX "CleanerScoreLog_jobId_idx" ON "CleanerScoreLog"("jobId");

-- CreateIndex
CREATE INDEX "CleanerScoreLog_eventType_idx" ON "CleanerScoreLog"("eventType");

-- CreateIndex
CREATE INDEX "Quote_customerId_idx" ON "Quote"("customerId");

-- CreateIndex
CREATE INDEX "Quote_postcode_idx" ON "Quote"("postcode");

-- CreateIndex
CREATE INDEX "Quote_quoteStatus_idx" ON "Quote"("quoteStatus");

-- CreateIndex
CREATE INDEX "QuoteAddon_quoteId_idx" ON "QuoteAddon"("quoteId");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- CreateIndex
CREATE INDEX "Booking_quoteId_idx" ON "Booking"("quoteId");

-- CreateIndex
CREATE INDEX "Booking_bookingStatus_idx" ON "Booking"("bookingStatus");

-- CreateIndex
CREATE INDEX "Booking_scheduledDate_idx" ON "Booking"("scheduledDate");

-- CreateIndex
CREATE INDEX "Booking_servicePostcode_idx" ON "Booking"("servicePostcode");

-- CreateIndex
CREATE INDEX "Booking_providerCompanyId_idx" ON "Booking"("providerCompanyId");

-- CreateIndex
CREATE INDEX "BookingAddon_bookingId_idx" ON "BookingAddon"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerPaymentIntentId_key" ON "Payment"("providerPaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerChargeId_key" ON "Payment"("providerChargeId");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_customerId_idx" ON "Payment"("customerId");

-- CreateIndex
CREATE INDEX "Payment_paymentStatus_idx" ON "Payment"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_providerRefundId_key" ON "Refund"("providerRefundId");

-- CreateIndex
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");

-- CreateIndex
CREATE INDEX "Refund_bookingId_idx" ON "Refund"("bookingId");

-- CreateIndex
CREATE INDEX "Refund_status_idx" ON "Refund"("status");

-- CreateIndex
CREATE INDEX "Job_bookingId_idx" ON "Job"("bookingId");

-- CreateIndex
CREATE INDEX "Job_jobStatus_idx" ON "Job"("jobStatus");

-- CreateIndex
CREATE INDEX "Job_assignedCleanerId_idx" ON "Job"("assignedCleanerId");

-- CreateIndex
CREATE INDEX "JobOffer_jobId_idx" ON "JobOffer"("jobId");

-- CreateIndex
CREATE INDEX "JobOffer_cleanerId_idx" ON "JobOffer"("cleanerId");

-- CreateIndex
CREATE INDEX "JobOffer_offerStatus_idx" ON "JobOffer"("offerStatus");

-- CreateIndex
CREATE INDEX "JobAssignment_jobId_idx" ON "JobAssignment"("jobId");

-- CreateIndex
CREATE INDEX "JobAssignment_bookingId_idx" ON "JobAssignment"("bookingId");

-- CreateIndex
CREATE INDEX "JobAssignment_cleanerId_idx" ON "JobAssignment"("cleanerId");

-- CreateIndex
CREATE INDEX "JobAssignment_assignmentStatus_idx" ON "JobAssignment"("assignmentStatus");

-- CreateIndex
CREATE INDEX "JobCancellation_jobId_idx" ON "JobCancellation"("jobId");

-- CreateIndex
CREATE INDEX "JobCancellation_bookingId_idx" ON "JobCancellation"("bookingId");

-- CreateIndex
CREATE INDEX "JobCancellation_cleanerId_idx" ON "JobCancellation"("cleanerId");

-- CreateIndex
CREATE INDEX "Complaint_bookingId_idx" ON "Complaint"("bookingId");

-- CreateIndex
CREATE INDEX "Complaint_jobId_idx" ON "Complaint"("jobId");

-- CreateIndex
CREATE INDEX "Complaint_customerId_idx" ON "Complaint"("customerId");

-- CreateIndex
CREATE INDEX "Complaint_cleanerId_idx" ON "Complaint"("cleanerId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Notification_relatedType_relatedId_idx" ON "Notification"("relatedType", "relatedId");

-- CreateIndex
CREATE INDEX "Notification_recipientType_recipientId_idx" ON "Notification"("recipientType", "recipientId");

-- CreateIndex
CREATE INDEX "Notification_channel_idx" ON "Notification"("channel");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "NotificationLog_notificationId_idx" ON "NotificationLog"("notificationId");

-- CreateIndex
CREATE INDEX "AuditLog_actorType_actorId_idx" ON "AuditLog"("actorType", "actorId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actionType_idx" ON "AuditLog"("actionType");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePage_slug_key" ON "ServicePage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SeoLandingPage_slug_key" ON "SeoLandingPage"("slug");

-- CreateIndex
CREATE INDEX "SeoLandingPage_locationName_idx" ON "SeoLandingPage"("locationName");

-- CreateIndex
CREATE INDEX "SeoLandingPage_serviceName_idx" ON "SeoLandingPage"("serviceName");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoleAssignment_userId_roleId_key" ON "UserRoleAssignment"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCompany_userId_key" ON "ProviderCompany"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCompany_companyNumber_key" ON "ProviderCompany"("companyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderServiceCategory_providerCompanyId_categoryKey_key" ON "ProviderServiceCategory"("providerCompanyId", "categoryKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCoverageArea_postcodePrefix_categoryKey_key" ON "ProviderCoverageArea"("postcodePrefix", "categoryKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderPricingRule_providerCompanyId_categoryKey_serviceKe_key" ON "ProviderPricingRule"("providerCompanyId", "categoryKey", "serviceKey");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderInvite_token_key" ON "ProviderInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "StripeConnectedAccount_providerCompanyId_key" ON "StripeConnectedAccount"("providerCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeConnectedAccount_stripeAccountId_key" ON "StripeConnectedAccount"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingPriceSnapshot_bookingId_key" ON "BookingPriceSnapshot"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_stripeCheckoutSessionId_key" ON "PaymentRecord"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_stripePaymentIntentId_key" ON "PaymentRecord"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_stripeChargeId_key" ON "PaymentRecord"("stripeChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_stripeBalanceTransactionId_key" ON "PaymentRecord"("stripeBalanceTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "RefundRecord_stripeRefundId_key" ON "RefundRecord"("stripeRefundId");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeRecord_stripeDisputeId_key" ON "DisputeRecord"("stripeDisputeId");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutRecord_stripePayoutId_key" ON "PayoutRecord"("stripePayoutId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceRecord_number_key" ON "InvoiceRecord"("number");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_externalEventId_key" ON "WebhookEvent"("externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSetting_key_key" ON "AdminSetting"("key");

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerApplication" ADD CONSTRAINT "CleanerApplication_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerDocument" ADD CONSTRAINT "CleanerDocument_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerDocument" ADD CONSTRAINT "CleanerDocument_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerVerificationReview" ADD CONSTRAINT "CleanerVerificationReview_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerVerificationReview" ADD CONSTRAINT "CleanerVerificationReview_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerContract" ADD CONSTRAINT "CleanerContract_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerAvailabilityRule" ADD CONSTRAINT "CleanerAvailabilityRule_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerUnavailableDate" ADD CONSTRAINT "CleanerUnavailableDate_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerServiceArea" ADD CONSTRAINT "CleanerServiceArea_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerScore" ADD CONSTRAINT "CleanerScore_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerScoreLog" ADD CONSTRAINT "CleanerScoreLog_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerScoreLog" ADD CONSTRAINT "CleanerScoreLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerScoreLog" ADD CONSTRAINT "CleanerScoreLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAddon" ADD CONSTRAINT "QuoteAddon_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerAddressId_fkey" FOREIGN KEY ("customerAddressId") REFERENCES "CustomerAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "ProviderCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_processedByAdminId_fkey" FOREIGN KEY ("processedByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_assignedCleanerId_fkey" FOREIGN KEY ("assignedCleanerId") REFERENCES "Cleaner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignment" ADD CONSTRAINT "JobAssignment_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCancellation" ADD CONSTRAINT "JobCancellation_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCancellation" ADD CONSTRAINT "JobCancellation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobCancellation" ADD CONSTRAINT "JobCancellation_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "Cleaner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoleAssignment" ADD CONSTRAINT "UserRoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderCompany" ADD CONSTRAINT "ProviderCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderServiceCategory" ADD CONSTRAINT "ProviderServiceCategory_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "ProviderCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderCoverageArea" ADD CONSTRAINT "ProviderCoverageArea_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "ProviderCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderPricingRule" ADD CONSTRAINT "ProviderPricingRule_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "ProviderCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderInvite" ADD CONSTRAINT "ProviderInvite_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "ProviderCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAgreement" ADD CONSTRAINT "ProviderAgreement_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "ProviderCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeConnectedAccount" ADD CONSTRAINT "StripeConnectedAccount_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "ProviderCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPriceSnapshot" ADD CONSTRAINT "BookingPriceSnapshot_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRecord" ADD CONSTRAINT "RefundRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeRecord" ADD CONSTRAINT "DisputeRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeRecord" ADD CONSTRAINT "DisputeRecord_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "ProviderCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRecord" ADD CONSTRAINT "PayoutRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRecord" ADD CONSTRAINT "PayoutRecord_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "ProviderCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceRecord" ADD CONSTRAINT "InvoiceRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceRecord" ADD CONSTRAINT "InvoiceRecord_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "ProviderCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLogV2" ADD CONSTRAINT "NotificationLogV2_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLogV2" ADD CONSTRAINT "NotificationLogV2_providerCompanyId_fkey" FOREIGN KEY ("providerCompanyId") REFERENCES "ProviderCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

