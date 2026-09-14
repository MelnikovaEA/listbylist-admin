import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import type {ChecklistAssetBundle} from '../files/bundle';
import {saveChecklistFiles} from './saveChecklistFiles';

async function createPngBuffer(): Promise<Buffer> {
    return sharp({
        create: {
            width: 1_000,
            height: 1_400,
            channels: 4,
            background: '#ffffff',
        },
    }).png().toBuffer();
}

const pdfBuffer = Buffer.from('%PDF-1.7\n%%EOF');
test('edit without uploads reports unchanged files and does not access S3', async () => {
    const result = await saveChecklistFiles(
        'test',
        new FormData(),
        'edit',
        {
            async upload() {
                throw new Error('upload must not be called');
            },
        },
    );

    assert.deepEqual(result, {changed: false});
});

test('edit with only a new PNG requires a new PDF', async () => {
    const formData = new FormData();
    const pngBuffer = await createPngBuffer();
    formData.set('image', new File([new Uint8Array(pngBuffer).buffer], 'checklist.png', {
        type: 'image/png',
    }));
    await assert.rejects(
        saveChecklistFiles('test', formData, 'edit', {
            async upload() {
                throw new Error('upload must not be called');
            },
        }),
        /При замене checklist\.png также загрузи новый checklist\.pdf/,
    );
});

test('edit with only a new PDF requires a new PNG', async () => {
    const formData = new FormData();
    formData.set('pdf', new File([new Uint8Array(pdfBuffer).buffer], 'checklist.pdf', {
        type: 'application/pdf',
    }));

    await assert.rejects(
        saveChecklistFiles('test', formData, 'edit', {
            async upload() {
                throw new Error('upload must not be called');
            },
        }),
        /При замене checklist\.pdf также загрузи новый checklist\.png/,
    );
});

test('edit with both files uploads a complete bundle', async () => {
    const formData = new FormData();
    const pngBuffer = await createPngBuffer();
    formData.set('image', new File([new Uint8Array(pngBuffer).buffer], 'checklist.png', {
        type: 'image/png',
    }));
    formData.set('pdf', new File([new Uint8Array(pdfBuffer).buffer], 'checklist.pdf', {
        type: 'application/pdf',
    }));
    const uploadedBundles: ChecklistAssetBundle[] = [];

    const result = await saveChecklistFiles('test', formData, 'edit', {
        async upload(bundle) {
            uploadedBundles.push(bundle);
        },
    });

    assert.equal(uploadedBundles[0]?.assets.length, 6);
    assert.equal(result.changed, true);
    assert.ok(result.changed && result.bundle);
});
