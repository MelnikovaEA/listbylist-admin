import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import { validatePdf, validatePng } from './checklistFileValidation';
import {
    deleteChecklistAssetBundle,
    prepareChecklistAssetBundle,
    uploadChecklistAssetBundle,
} from './checklistAssetBundle';

async function createTestBundle() {
    const pngBuffer = await sharp({
        create: {
            width: 1_000,
            height: 1_400,
            channels: 4,
            background: '#ffffff',
        },
    }).png().toBuffer();
    const png = await validatePng(
        new File([pngBuffer], 'checklist.png', { type: 'image/png' }),
    );
    const pdf = await validatePdf(
        new File(['%PDF-1.7\n%%EOF'], 'checklist.pdf', {
            type: 'application/pdf',
        }),
    );

    return prepareChecklistAssetBundle({
        slug: 'test-checklist',
        png,
        pdf,
        version: 'test-version',
    });
}

test('prepareChecklistAssetBundle creates six versioned objects', async () => {
    const bundle = await createTestBundle();

    assert.equal(bundle.version, 'test-version');
    assert.deepEqual(
        bundle.assets.map((asset) => asset.key),
        [
            'checklists/test-checklist/test-version/preview-400.webp',
            'checklists/test-checklist/test-version/preview-640.webp',
            'checklists/test-checklist/test-version/preview-960.webp',
            'checklists/test-checklist/test-version/view.webp',
            'checklists/test-checklist/test-version/checklist.png',
            'checklists/test-checklist/test-version/checklist.pdf',
        ],
    );
});

test('prepared WebP files have responsive dimensions and inline behavior', async () => {
    const bundle = await createTestBundle();
    const webpAssets = bundle.assets.slice(0, 4);

    assert.deepEqual(
        webpAssets.map((asset) => asset.width),
        [400, 640, 960, 1_000],
    );
    assert.ok(webpAssets.every((asset) => asset.contentType === 'image/webp'));
    assert.ok(webpAssets.every((asset) => asset.contentDisposition === 'inline'));
    assert.ok(webpAssets.every((asset) => asset.bytes > 0));
});

test('prepared PNG and PDF use attachment filenames based on the slug', async () => {
    const bundle = await createTestBundle();
    const png = bundle.assets.find((asset) => asset.role === 'DOWNLOAD_IMAGE');
    const pdf = bundle.assets.find((asset) => asset.role === 'PDF');

    assert.equal(png?.contentDisposition, 'attachment; filename="test-checklist.png"');
    assert.equal(pdf?.contentDisposition, 'attachment; filename="test-checklist.pdf"');
    assert.equal(png?.contentType, 'image/png');
    assert.equal(pdf?.contentType, 'application/pdf');
});

test('uploadChecklistAssetBundle removes every successful upload after a partial failure', async () => {
    const bundle = await createTestBundle();
    const uploadedKeys: string[] = [];
    const removedKeys: string[] = [];
    const failedKey = bundle.assets[3].key;

    await assert.rejects(
        uploadChecklistAssetBundle(bundle, {
            async upload(asset) {
                if (asset.key === failedKey) {
                    throw new Error('simulated upload failure');
                }

                uploadedKeys.push(asset.key);
            },
            async remove(key) {
                removedKeys.push(key);
            },
        }),
        /Загруженная часть удалена/,
    );

    assert.equal(uploadedKeys.length, 5);
    assert.deepEqual(removedKeys.sort(), uploadedKeys.sort());
    assert.ok(!removedKeys.includes(failedKey));
});

test('uploadChecklistAssetBundle keeps all objects after a successful upload', async () => {
    const bundle = await createTestBundle();
    const uploadedKeys: string[] = [];
    const removedKeys: string[] = [];

    await uploadChecklistAssetBundle(bundle, {
        async upload(asset) {
            uploadedKeys.push(asset.key);
        },
        async remove(key) {
            removedKeys.push(key);
        },
    });

    assert.equal(uploadedKeys.length, 6);
    assert.deepEqual(removedKeys, []);
});

test('deleteChecklistAssetBundle attempts to remove every object', async () => {
    const bundle = await createTestBundle();
    const removedKeys: string[] = [];

    await deleteChecklistAssetBundle(bundle, async (key) => {
        removedKeys.push(key);
    });

    assert.deepEqual(
        removedKeys.sort(),
        bundle.assets.map((asset) => asset.key).sort(),
    );
});

test('deleteChecklistAssetBundle reports failures after attempting every object', async () => {
    const bundle = await createTestBundle();
    const removedKeys: string[] = [];
    const failedKey = bundle.assets[2].key;

    await assert.rejects(
        deleteChecklistAssetBundle(bundle, async (key) => {
            removedKeys.push(key);

            if (key === failedKey) {
                throw new Error('simulated delete failure');
            }
        }),
        /Не удалось удалить весь комплект/,
    );

    assert.equal(removedKeys.length, bundle.assets.length);
});
