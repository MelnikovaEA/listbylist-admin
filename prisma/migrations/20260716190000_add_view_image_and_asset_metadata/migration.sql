-- Add a browser-friendly image variant without changing existing assets.
ALTER TYPE "AssetType" ADD VALUE 'VIEW_IMAGE';

ALTER TABLE "ChecklistAsset"
ADD COLUMN "width" INTEGER,
ADD COLUMN "height" INTEGER,
ADD COLUMN "bytes" INTEGER,
ADD COLUMN "mimeType" TEXT;
