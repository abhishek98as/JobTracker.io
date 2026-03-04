-- Extend Application with resume/referral/reminder fields
ALTER TABLE "Application" ADD COLUMN "resumeAssetId" TEXT;
ALTER TABLE "Application" ADD COLUMN "referralContactId" TEXT;
ALTER TABLE "Application" ADD COLUMN "customReminderAt" DATETIME;
ALTER TABLE "Application" ADD COLUMN "customReminderNote" TEXT;

-- New Phase 1 tables
CREATE TABLE "ResumeAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "roleTag" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "blobPath" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResumeAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ReferralContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReferralContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "InterviewRound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "roundType" TEXT NOT NULL,
    "interviewerName" TEXT,
    "scheduledAt" DATETIME,
    "questionsAsked" TEXT,
    "answersGiven" TEXT,
    "outcome" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InterviewRound_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CompanyResearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "companySize" TEXT,
    "industry" TEXT,
    "techStack" TEXT,
    "glassdoorRating" TEXT,
    "cultureNotes" TEXT,
    "interviewInsights" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanyResearch_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "WeeklyGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekStartDate" DATETIME NOT NULL,
    "targetApplications" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WeeklyGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "metaJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX "Application_userId_platform_status_createdAt_idx" ON "Application" ("userId", "platform", "status", "createdAt");
CREATE INDEX "Application_resumeAssetId_idx" ON "Application" ("resumeAssetId");
CREATE INDEX "Application_referralContactId_idx" ON "Application" ("referralContactId");
CREATE INDEX "ResumeAsset_userId_createdAt_idx" ON "ResumeAsset" ("userId", "createdAt");
CREATE INDEX "ReferralContact_userId_email_idx" ON "ReferralContact" ("userId", "email");
CREATE INDEX "InterviewRound_applicationId_createdAt_idx" ON "InterviewRound" ("applicationId", "createdAt");
CREATE UNIQUE INDEX "CompanyResearch_applicationId_key" ON "CompanyResearch" ("applicationId");
CREATE UNIQUE INDEX "WeeklyGoal_userId_weekStartDate_key" ON "WeeklyGoal" ("userId", "weekStartDate");
CREATE INDEX "WeeklyGoal_userId_weekStartDate_idx" ON "WeeklyGoal" ("userId", "weekStartDate");
CREATE INDEX "ActivityEvent_userId_occurredAt_idx" ON "ActivityEvent" ("userId", "occurredAt" DESC);
CREATE INDEX "ActivityEvent_applicationId_idx" ON "ActivityEvent" ("applicationId");

-- Backfill ActivityEvent from existing data
INSERT INTO "ActivityEvent" (
    "id",
    "userId",
    "applicationId",
    "eventType",
    "title",
    "description",
    "occurredAt",
    "metaJson",
    "createdAt"
)
SELECT
    lower(hex(randomblob(16))),
    "userId",
    "id",
    'application_created',
    'Applied to ' || "company",
    "role" || ' via ' || "platform",
    COALESCE("appliedAt", "createdAt"),
    NULL,
    CURRENT_TIMESTAMP
FROM "Application";

INSERT INTO "ActivityEvent" (
    "id",
    "userId",
    "applicationId",
    "eventType",
    "title",
    "description",
    "occurredAt",
    "metaJson",
    "createdAt"
)
SELECT
    lower(hex(randomblob(16))),
    a."userId",
    s."applicationId",
    'status_changed',
    'Status changed to ' || s."toStatus",
    s."fromStatus" || ' -> ' || s."toStatus",
    s."changedAt",
    NULL,
    CURRENT_TIMESTAMP
FROM "StatusChange" s
JOIN "Application" a ON a."id" = s."applicationId";