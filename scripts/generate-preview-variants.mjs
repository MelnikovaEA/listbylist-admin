import "dotenv/config";
import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import sharp from "sharp";

const publicSiteDir = process.env.PUBLIC_SITE_DIR
  ? path.resolve(process.env.PUBLIC_SITE_DIR)
  : path.resolve(process.cwd(), "..", "checklist-site");
const checklistsDir = path.join(publicSiteDir, "public", "checklists");
const widths = [400, 640, 960];
const generatedAssets = [];

for (const entry of await readdir(checklistsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;

  const directory = path.join(checklistsDir, entry.name);
  const source = path.join(directory, "checklist.png");

  const viewPath = path.join(directory, "view.webp");

  await Promise.all([
    ...widths.map((width) =>
      sharp(source)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 86, effort: 4 })
        .toFile(path.join(directory, `preview-${width}.webp`)),
    ),
    sharp(source)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 88, effort: 4 })
      .toFile(viewPath),
  ]);

  const previewPath = path.join(directory, "preview-960.webp");
  const [previewMetadata, previewStat, viewMetadata, viewStat] = await Promise.all([
    sharp(previewPath).metadata(),
    stat(previewPath),
    sharp(viewPath).metadata(),
    stat(viewPath),
  ]);
  generatedAssets.push({
    slug: entry.name,
    preview: {
      url: `/checklists/${entry.name}/preview-960.webp`,
      width: previewMetadata.width ?? 960,
      height: previewMetadata.height ?? null,
      bytes: previewStat.size,
    },
    view: {
      url: `/checklists/${entry.name}/view.webp`,
      width: viewMetadata.width ?? 1200,
      height: viewMetadata.height ?? null,
      bytes: viewStat.size,
    },
  });

  await Promise.all([
    rm(path.join(directory, "preview.jpg"), { force: true }),
    rm(path.join(directory, "preview.webp"), { force: true }),
  ]);

  console.log(`Generated responsive previews and view image: ${entry.name}`);
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined; image asset records were not updated.");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  for (const asset of generatedAssets) {
    await pool.query(
      `UPDATE "ChecklistAsset"
       SET "url" = $1, "width" = $2, "height" = $3, "bytes" = $4,
           "mimeType" = 'image/webp', "updatedAt" = CURRENT_TIMESTAMP
       WHERE "type" = 'PREVIEW_IMAGE'
         AND "checklistId" = (SELECT "id" FROM "Checklist" WHERE "slug" = $5)`,
      [asset.preview.url, asset.preview.width, asset.preview.height, asset.preview.bytes, asset.slug],
    );

    await pool.query(
      `WITH checklist AS (
         SELECT "id", "title" FROM "Checklist" WHERE "slug" = $5
       ), updated AS (
         UPDATE "ChecklistAsset" AS asset
         SET "url" = $1, "width" = $2, "height" = $3, "bytes" = $4,
             "mimeType" = 'image/webp', "sortOrder" = 2, "updatedAt" = CURRENT_TIMESTAMP
         FROM checklist
         WHERE asset."type" = 'VIEW_IMAGE' AND asset."checklistId" = checklist."id"
         RETURNING asset."id"
       )
       INSERT INTO "ChecklistAsset"
         ("type", "url", "alt", "sortOrder", "width", "height", "bytes", "mimeType", "checklistId")
       SELECT 'VIEW_IMAGE', $1, 'Чек-лист для просмотра: ' || checklist."title", 2,
              $2, $3, $4, 'image/webp', checklist."id"
       FROM checklist
       WHERE NOT EXISTS (SELECT 1 FROM updated)`,
      [asset.view.url, asset.view.width, asset.view.height, asset.view.bytes, asset.slug],
    );
  }
} finally {
  await pool.end();
}

console.log(`Updated preview and view assets for ${generatedAssets.length} checklists in PostgreSQL.`);
