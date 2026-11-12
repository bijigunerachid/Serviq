/*
  Warnings:

  - Added the required column `membershipId` to the `EmailVerificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EmailVerificationToken" ADD COLUMN     "membershipId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "EmailVerificationToken_membershipId_idx" ON "EmailVerificationToken"("membershipId");

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
