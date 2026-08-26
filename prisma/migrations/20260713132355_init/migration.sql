/*
  Warnings:

  - The primary key for the `Category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Category` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Checklist` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Checklist` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ChecklistAsset` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ChecklistAsset` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ChecklistItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ChecklistItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ChecklistTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Tag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Tag` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `categoryId` on the `Checklist` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `checklistId` on the `ChecklistAsset` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `checklistId` on the `ChecklistItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `checklistId` on the `ChecklistTag` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `tagId` on the `ChecklistTag` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
ALTER TYPE "AssetType" ADD VALUE 'DOWNLOAD_IMAGE';

-- DropForeignKey
ALTER TABLE "Checklist" DROP CONSTRAINT "Checklist_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "ChecklistAsset" DROP CONSTRAINT "ChecklistAsset_checklistId_fkey";

-- DropForeignKey
ALTER TABLE "ChecklistItem" DROP CONSTRAINT "ChecklistItem_checklistId_fkey";

-- DropForeignKey
ALTER TABLE "ChecklistTag" DROP CONSTRAINT "ChecklistTag_checklistId_fkey";

-- DropForeignKey
ALTER TABLE "ChecklistTag" DROP CONSTRAINT "ChecklistTag_tagId_fkey";

-- DropIndex
DROP INDEX "Checklist_slug_idx";

-- AlterTable
ALTER TABLE "Category" DROP CONSTRAINT "Category_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Checklist" DROP CONSTRAINT "Checklist_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
DROP COLUMN "categoryId",
ADD COLUMN     "categoryId" UUID NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "Checklist_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ChecklistAsset" DROP CONSTRAINT "ChecklistAsset_pkey",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
DROP COLUMN "checklistId",
ADD COLUMN     "checklistId" UUID NOT NULL,
ADD CONSTRAINT "ChecklistAsset_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ChecklistItem" DROP CONSTRAINT "ChecklistItem_pkey",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
DROP COLUMN "checklistId",
ADD COLUMN     "checklistId" UUID NOT NULL,
ADD CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ChecklistTag" DROP CONSTRAINT "ChecklistTag_pkey",
DROP COLUMN "checklistId",
ADD COLUMN     "checklistId" UUID NOT NULL,
DROP COLUMN "tagId",
ADD COLUMN     "tagId" UUID NOT NULL,
ADD CONSTRAINT "ChecklistTag_pkey" PRIMARY KEY ("checklistId", "tagId");

-- AlterTable
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "Tag_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "Checklist_categoryId_idx" ON "Checklist"("categoryId");

-- CreateIndex
CREATE INDEX "ChecklistAsset_checklistId_idx" ON "ChecklistAsset"("checklistId");

-- CreateIndex
CREATE INDEX "ChecklistItem_checklistId_idx" ON "ChecklistItem"("checklistId");

-- AddForeignKey
ALTER TABLE "Checklist" ADD CONSTRAINT "Checklist_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistAsset" ADD CONSTRAINT "ChecklistAsset_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTag" ADD CONSTRAINT "ChecklistTag_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "Checklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTag" ADD CONSTRAINT "ChecklistTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
