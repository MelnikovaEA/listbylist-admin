import 'server-only';

import path from 'node:path';
import sharp, { type Metadata } from 'sharp';

export const MAX_PNG_BYTES = 25 * 1024 * 1024;
export const MAX_PDF_BYTES = 15 * 1024 * 1024;
export const MAX_PNG_WIDTH = 5_000;
export const MAX_PNG_HEIGHT = 7_000;
export const MAX_PNG_PIXELS = 35_000_000;

export type ValidatedPng = {
    buffer: Buffer;
    bytes: number;
    width: number;
    height: number;
    mimeType: 'image/png';
};

export type ValidatedPdf = {
    buffer: Buffer;
    bytes: number;
    mimeType: 'application/pdf';
};

function assertFileExtension(file: File, expectedExtension: string, label: string): void {
    const extension = path.extname(file.name).toLowerCase();

    if (extension !== expectedExtension) {
        throw new Error(`${label}: ожидается файл ${expectedExtension}.`);
    }
}

export async function validatePng(file: File): Promise<ValidatedPng> {
    assertFileExtension(file, '.png', 'Изображение');

    if (file.size > MAX_PNG_BYTES) {
        throw new Error('PNG слишком большой. Максимальный размер — 25 МБ.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let metadata: Metadata;

    try {
        metadata = await sharp(buffer, {
            limitInputPixels: MAX_PNG_PIXELS,
            failOn: 'error',
        }).metadata();
    } catch {
        throw new Error('Не удалось прочитать PNG. Проверь файл и его разрешение.');
    }

    if (metadata.format !== 'png') {
        throw new Error('Изображение должно быть настоящим PNG-файлом.');
    }

    if (!metadata.width || !metadata.height) {
        throw new Error('Не удалось определить разрешение PNG.');
    }

    if (metadata.width > MAX_PNG_WIDTH || metadata.height > MAX_PNG_HEIGHT) {
        throw new Error('PNG слишком большой. Максимальное разрешение — 5000 × 7000 px.');
    }

    return {
        buffer,
        bytes: buffer.byteLength,
        width: metadata.width,
        height: metadata.height,
        mimeType: 'image/png',
    };
}

export async function validatePdf(file: File): Promise<ValidatedPdf> {
    assertFileExtension(file, '.pdf', 'PDF');

    if (file.size > MAX_PDF_BYTES) {
        throw new Error('PDF слишком большой. Максимальный размер — 15 МБ.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const signature = buffer.subarray(0, 5).toString('ascii');

    if (signature !== '%PDF-') {
        throw new Error('Файл должен быть настоящим PDF-документом.');
    }

    return {
        buffer,
        bytes: buffer.byteLength,
        mimeType: 'application/pdf',
    };
}
