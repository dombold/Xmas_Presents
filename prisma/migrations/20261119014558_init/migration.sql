-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "householdId" TEXT,
    "canLogin" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gift" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "buyerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "costCents" INTEGER NOT NULL,
    "note" TEXT,
    "enteredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftRecipient" (
    "giftId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "GiftRecipient_pkey" PRIMARY KEY ("giftId","personId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Household_name_key" ON "Household"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Person_name_key" ON "Person"("name");

-- CreateIndex
CREATE INDEX "Person_householdId_idx" ON "Person"("householdId");

-- CreateIndex
CREATE INDEX "Gift_year_idx" ON "Gift"("year");

-- CreateIndex
CREATE INDEX "Gift_buyerId_idx" ON "Gift"("buyerId");

-- CreateIndex
CREATE INDEX "GiftRecipient_personId_idx" ON "GiftRecipient"("personId");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_enteredById_fkey" FOREIGN KEY ("enteredById") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftRecipient" ADD CONSTRAINT "GiftRecipient_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftRecipient" ADD CONSTRAINT "GiftRecipient_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
