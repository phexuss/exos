-- CreateTable
CREATE TABLE "SpotifyConnection" (
    "userId" TEXT NOT NULL,
    "spotifyUserId" TEXT NOT NULL,
    "displayName" TEXT,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotifyConnection_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "SpotifyConnection" ADD CONSTRAINT "SpotifyConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
