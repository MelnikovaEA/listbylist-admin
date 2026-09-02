import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import {
    MAX_PDF_BYTES,
    MAX_PNG_BYTES,
    validatePdf,
    validatePng,
} from './validation';

test('validatePng accepts a real PNG and returns its metadata', async () => {
    const source = await sharp({
        create: {
            width: 100,
            height: 200,
            channels: 4,
            background: '#ffffff',
        },
    }).png().toBuffer();
    const file = new File([source], 'checklist.png', { type: 'image/png' });

    const result = await validatePng(file);

    assert.equal(result.width, 100);
    assert.equal(result.height, 200);
    assert.equal(result.bytes, source.byteLength);
    assert.equal(result.mimeType, 'image/png');
});

test('validatePng rejects non-PNG content with a PNG extension', async () => {
    const file = new File(['not an image'], 'checklist.png', { type: 'image/png' });

    await assert.rejects(validatePng(file), /Не удалось прочитать PNG/);
});

test('validatePng rejects a file over 25 MB before image decoding', async () => {
    const file = new File(
        [new Uint8Array(MAX_PNG_BYTES + 1)],
        'checklist.png',
        { type: 'image/png' },
    );

    await assert.rejects(validatePng(file), /Максимальный размер — 25 МБ/);
});

test('validatePng rejects an image wider than 5000 px', async () => {
    const source = await sharp({
        create: {
            width: 5_001,
            height: 1,
            channels: 4,
            background: '#ffffff',
        },
    }).png().toBuffer();
    const file = new File([source], 'checklist.png', { type: 'image/png' });

    await assert.rejects(validatePng(file), /Максимальное разрешение — 5000 × 7000 px/);
});

test('validatePdf accepts a PDF signature', async () => {
    const file = new File(['%PDF-1.7\n%%EOF'], 'checklist.pdf', {
        type: 'application/pdf',
    });

    const result = await validatePdf(file);

    assert.equal(result.mimeType, 'application/pdf');
    assert.equal(result.bytes, file.size);
});

test('validatePdf rejects non-PDF content with a PDF extension', async () => {
    const file = new File(['not a pdf'], 'checklist.pdf', {
        type: 'application/pdf',
    });

    await assert.rejects(validatePdf(file), /настоящим PDF-документом/);
});

test('validatePdf rejects a file over 15 MB', async () => {
    const file = new File(
        [new Uint8Array(MAX_PDF_BYTES + 1)],
        'checklist.pdf',
        { type: 'application/pdf' },
    );

    await assert.rejects(validatePdf(file), /Максимальный размер — 15 МБ/);
});
