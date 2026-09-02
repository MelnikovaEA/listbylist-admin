import 'server-only';

import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import type { ValidatedPdf, ValidatedPng } from './validation';
import { MAX_PNG_PIXELS } from './validation';
import {
    deleteObject,
    uploadObject,
    type ObjectContentDisposition,
    type UploadObjectInput,
} from '@/src/lib/storage/objectStorage';

export type ChecklistAssetRole =
    | 'PREVIEW_400'
    | 'PREVIEW_640'
    | 'PREVIEW_960'
    | 'VIEW'
    | 'DOWNLOAD_IMAGE'
    | 'PDF';

export type PreparedChecklistAsset = UploadObjectInput & {
    role: ChecklistAssetRole;
    width: number | null;
    height: number | null;
    bytes: number;
};

export type ChecklistAssetBundle = {
    version: string;
    assets: PreparedChecklistAsset[];
};

type PrepareChecklistAssetBundleInput = {
    slug: string;
    png: ValidatedPng;
    pdf: ValidatedPdf;
    version?: string;
};

type StorageOperations = {
    upload: (input: UploadObjectInput) => Promise<void>;
    remove: (key: string) => Promise<void>;
};

const previewWidths = [400, 640, 960] as const;

export function createAssetVersion(): string {
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    return `${timestamp}-${randomUUID().slice(0, 8)}`;
}

async function createWebpAsset(
    source: Buffer,
    role: ChecklistAssetRole,
    key: string,
    width: number,
    quality: number,
): Promise<PreparedChecklistAsset> {
    const { data, info } = await sharp(source, {
        limitInputPixels: MAX_PNG_PIXELS,
        failOn: 'error',
    })
        .resize({ width, withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toBuffer({ resolveWithObject: true });

    return {
        role,
        key,
        body: data,
        contentType: 'image/webp',
        contentDisposition: 'inline',
        width: info.width,
        height: info.height,
        bytes: data.byteLength,
    };
}

function createOriginalAsset(
    role: 'DOWNLOAD_IMAGE' | 'PDF',
    key: string,
    body: Buffer,
    contentType: 'image/png' | 'application/pdf',
    contentDisposition: ObjectContentDisposition,
    width: number | null,
    height: number | null,
): PreparedChecklistAsset {
    return {
        role,
        key,
        body,
        contentType,
        contentDisposition,
        width,
        height,
        bytes: body.byteLength,
    };
}

export async function prepareChecklistAssetBundle({
    slug,
    png,
    pdf,
    version = createAssetVersion(),
}: PrepareChecklistAssetBundleInput): Promise<ChecklistAssetBundle> {
    const directory = `checklists/${slug}/${version}`;
    const previews = await Promise.all(
        previewWidths.map((width) =>
            createWebpAsset(
                png.buffer,
                `PREVIEW_${width}`,
                `${directory}/preview-${width}.webp`,
                width,
                86,
            ),
        ),
    );
    const view = await createWebpAsset(
        png.buffer,
        'VIEW',
        `${directory}/view.webp`,
        1200,
        88,
    );

    return {
        version,
        assets: [
            ...previews,
            view,
            createOriginalAsset(
                'DOWNLOAD_IMAGE',
                `${directory}/checklist.png`,
                png.buffer,
                png.mimeType,
                `attachment; filename="${slug}.png"`,
                png.width,
                png.height,
            ),
            createOriginalAsset(
                'PDF',
                `${directory}/checklist.pdf`,
                pdf.buffer,
                pdf.mimeType,
                `attachment; filename="${slug}.pdf"`,
                null,
                null,
            ),
        ],
    };
}

export async function uploadChecklistAssetBundle(
    bundle: ChecklistAssetBundle,
    storage: StorageOperations = {
        upload: uploadObject,
        remove: deleteObject,
    },
): Promise<void> {
    const uploadResults = await Promise.allSettled(
        bundle.assets.map((asset) => storage.upload(asset)),
    );
    const uploadErrors = uploadResults
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => result.reason);

    if (uploadErrors.length === 0) {
        return;
    }

    const uploadedKeys = uploadResults.flatMap((result, index) =>
        result.status === 'fulfilled' ? [bundle.assets[index].key] : [],
    );
    const cleanupResults = await Promise.allSettled(
        uploadedKeys.map((key) => storage.remove(key)),
    );
    const cleanupErrors = cleanupResults
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => result.reason);

    throw new AggregateError(
        [...uploadErrors, ...cleanupErrors],
        cleanupErrors.length > 0
            ? 'Не удалось загрузить комплект полностью и очистить все загруженные объекты.'
            : 'Не удалось загрузить комплект файлов. Загруженная часть удалена.',
    );
}

export async function deleteChecklistAssetBundle(
    bundle: ChecklistAssetBundle,
    remove: StorageOperations['remove'] = deleteObject,
): Promise<void> {
    const deleteResults = await Promise.allSettled(
        bundle.assets.map((asset) => remove(asset.key)),
    );
    const deleteErrors = deleteResults
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((result) => result.reason);

    if (deleteErrors.length > 0) {
        throw new AggregateError(
            deleteErrors,
            'Не удалось удалить весь комплект файлов из хранилища.',
        );
    }
}
