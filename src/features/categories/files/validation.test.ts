import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import {
    MAX_CATEGORY_ICON_BYTES,
    validateCategoryIcon,
} from './validation';

async function createPng(width = 32, height = 24): Promise<Buffer> {
    return sharp({
        create: {
            width,
            height,
            channels: 4,
            background: {r: 255, g: 0, b: 0, alpha: 0.5},
        },
    }).png().toBuffer();
}

function toFilePart(buffer: Buffer): Uint8Array<ArrayBuffer> {
    return Uint8Array.from(buffer);
}

test('validateCategoryIcon accepts a decoded PNG regardless of browser MIME', async () => {
    const buffer = await createPng();
    const result = await validateCategoryIcon(
        new File([toFilePart(buffer)], 'icon.PNG', {type: 'application/octet-stream'}),
    );

    assert.equal(result.width, 32);
    assert.equal(result.height, 24);
    assert.deepEqual(result.buffer, buffer);
});

test('validateCategoryIcon rejects non-PNG content with a PNG extension', async () => {
    const jpeg = await sharp({
        create: {
            width: 20,
            height: 20,
            channels: 3,
            background: '#ffffff',
        },
    }).jpeg().toBuffer();

    await assert.rejects(
        validateCategoryIcon(new File([toFilePart(jpeg)], 'icon.png', {type: 'image/png'})),
        /настоящим PNG-файлом/,
    );
});

test('validateCategoryIcon rejects an unsupported extension', async () => {
    const buffer = await createPng();

    await assert.rejects(
        validateCategoryIcon(new File([toFilePart(buffer)], 'icon.webp', {type: 'image/png'})),
        /PNG-файлом/,
    );
});

test('validateCategoryIcon rejects files over 5 MiB before decoding', async () => {
    const oversized = new Uint8Array(MAX_CATEGORY_ICON_BYTES + 1);

    await assert.rejects(
        validateCategoryIcon(new File([oversized], 'icon.png', {type: 'image/png'})),
        /5 МБ/,
    );
});

test('validateCategoryIcon rejects dimensions above 4096 pixels', async () => {
    const buffer = await createPng(4097, 1);

    await assert.rejects(
        validateCategoryIcon(new File([toFilePart(buffer)], 'icon.png', {type: 'image/png'})),
        /4096 × 4096/,
    );
});

test('validateCategoryIcon limits decoded pixel count', async () => {
    const buffer = await createPng(4096, 4097);

    await assert.rejects(
        validateCategoryIcon(new File([toFilePart(buffer)], 'icon.png', {type: 'image/png'})),
        /Не удалось прочитать PNG/,
    );
});
