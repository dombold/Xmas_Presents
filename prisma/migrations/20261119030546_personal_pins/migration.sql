-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinHash" TEXT,
ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;
