-- CreateTable
CREATE TABLE "Settlement" (
    "year" INTEGER NOT NULL,
    "fromHouseholdId" TEXT NOT NULL,
    "toHouseholdId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "settledById" TEXT,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("year","fromHouseholdId","toHouseholdId")
);

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_fromHouseholdId_fkey" FOREIGN KEY ("fromHouseholdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_toHouseholdId_fkey" FOREIGN KEY ("toHouseholdId") REFERENCES "Household"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_settledById_fkey" FOREIGN KEY ("settledById") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
