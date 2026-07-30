-- CreateTable
CREATE TABLE "PromoCard" (
    "id" TEXT NOT NULL,
    "titleEs" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "subtitleEs" TEXT NOT NULL,
    "subtitleEn" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromoCard_isActive_sortOrder_idx" ON "PromoCard"("isActive", "sortOrder");
