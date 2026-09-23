import 'server-only';

import path from 'node:path';
import sharp, {type Metadata} from 'sharp';

export const MAX_CATEGORY_ICON_BYTES = 5 * 1024 * 1024;
export const MAX_CATEGORY_ICON_WIDTH = 4096;
export const MAX_CATEGORY_ICON_HEIGHT = 4096;
export const MAX_CATEGORY_ICON_PIXELS = 4096 * 4096;

export type ValidatedCategoryIcon = {
    buffer: Buffer;
    width: number;
    height: number;
};

export async function validateCategoryIcon(file: File): Promise<ValidatedCategoryIcon> {
    if (path.extname(file.name).toLowerCase() !== '.png') {
        throw new Error('Иконка категории должна быть PNG-файлом.');
    }

    if (file.size > MAX_CATEGORY_ICON_BYTES) {
        throw new Error('PNG слишком большой. Максимальный размер — 5 МБ.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let metadata: Metadata;

    try {
        metadata = await sharp(buffer, {
            limitInputPixels: MAX_CATEGORY_ICON_PIXELS,
            failOn: 'error',
        }).metadata();
    } catch {
        throw new Error('Не удалось прочитать PNG. Проверь файл и его разрешение.');
    }

    if (metadata.format !== 'png') {
        throw new Error('Иконка категории должна быть настоящим PNG-файлом.');
    }

    if (!metadata.width || !metadata.height) {
        throw new Error('Не удалось определить разрешение PNG.');
    }

    if (
        metadata.width > MAX_CATEGORY_ICON_WIDTH ||
        metadata.height > MAX_CATEGORY_ICON_HEIGHT
    ) {
        throw new Error('PNG слишком большой. Максимальное разрешение — 4096 × 4096 px.');
    }

    return {
        buffer,
        width: metadata.width,
        height: metadata.height,
    };
}
