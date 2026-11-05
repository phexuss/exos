-- AlterTable
ALTER TABLE "User" ADD COLUMN "verifyAttempts" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "VerificationCode" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
