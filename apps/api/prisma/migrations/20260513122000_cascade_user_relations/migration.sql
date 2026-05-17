-- Switch Session and VerificationCode foreign keys to ON DELETE CASCADE.
-- Previously RESTRICT, which blocked User deletion (manual cleanup, GDPR
-- removal) because dependent rows would prevent the parent row from being
-- removed. UserLibrary and UserRecentlyPlayed already cascade.

ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE "Session"
  ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VerificationCode" DROP CONSTRAINT IF EXISTS "VerificationCode_userId_fkey";
ALTER TABLE "VerificationCode"
  ADD CONSTRAINT "VerificationCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
