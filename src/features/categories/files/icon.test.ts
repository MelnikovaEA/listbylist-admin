import assert from 'node:assert/strict';
import test from 'node:test';
import sharp from 'sharp';
import {
    deleteCategoryIcon,
    prepareCategoryIcon,
    uploadCategoryIcon,
} from './icon';
import {validateCategoryIcon} from './validation';
import type {UploadObjectInput} from '@/src/lib/storage/objectStorage';

async function prepareTestIcon(width: number, height: number) {
    const source = await sharp({
        create: {
            width,
            height,
            channels: 4,
            background: {r: 220, g: 20, b: 60, alpha: 0.5},
        },
    }).png().toBuffer();
    const validated = await validateCategoryIcon(
        new File([source], 'icon.png', {type: 'image/png'}),
    );

    return prepareCategoryIcon('seasonal', validated, 'test-version');
}

async function getPixel(buffer: Buffer, x: number, y: number): Promise<number[]> {
    const {data, info} = await sharp(buffer)
        .ensureAlpha()
        .raw()
        .toBuffer({resolveWithObject: true});
    const offset = (y * info.width + x) * info.channels;

    return Array.from(data.subarray(offset, offset + info.channels));
}

test('prepareCategoryIcon contains a wide image on a transparent 512px canvas', async () => {
    const icon = await prepareTestIcon(1000, 500);
    const metadata = await sharp(icon.body).metadata();

    assert.equal(icon.key, 'categories/seasonal/test-version/icon.png');
    assert.equal(icon.contentType, 'image/png');
    assert.equal(icon.contentDisposition, 'inline');
    assert.equal(icon.width, 512);
    assert.equal(icon.height, 512);
    assert.equal(metadata.format, 'png');
    assert.equal(metadata.width, 512);
    assert.equal(metadata.height, 512);
    assert.equal(metadata.hasAlpha, true);
    assert.deepEqual(await getPixel(icon.body, 0, 0), [0, 0, 0, 0]);
    assert.ok((await getPixel(icon.body, 256, 256))[3] > 0);
});

test('prepareCategoryIcon does not upscale a smaller source', async () => {
    const icon = await prepareTestIcon(300, 200);

    assert.deepEqual(await getPixel(icon.body, 105, 155), [0, 0, 0, 0]);
    assert.ok((await getPixel(icon.body, 106, 156))[3] > 0);
    assert.ok((await getPixel(icon.body, 405, 355))[3] > 0);
    assert.deepEqual(await getPixel(icon.body, 406, 356), [0, 0, 0, 0]);
});

test('prepareCategoryIcon keeps a 512px source at its original size', async () => {
    const icon = await prepareTestIcon(512, 512);

    assert.ok((await getPixel(icon.body, 0, 0))[3] > 0);
    assert.ok((await getPixel(icon.body, 511, 511))[3] > 0);
});

test('uploadCategoryIcon delegates one prepared PNG to object storage', async () => {
    const icon = await prepareTestIcon(32, 32);
    const uploaded: UploadObjectInput[] = [];

    await uploadCategoryIcon(icon, async (input) => {
        uploaded.push(input);
    });

    assert.deepEqual(uploaded, [icon]);
});

test('deleteCategoryIcon removes only a valid category icon key', async () => {
    const removed: string[] = [];
    const key = 'categories/seasonal/test-version/icon.png';

    await deleteCategoryIcon(key, 'seasonal', async (candidate) => {
        removed.push(candidate);
    });

    await assert.rejects(
        deleteCategoryIcon('categories/seasonal/', 'seasonal', async (candidate) => {
            removed.push(candidate);
        }),
        /Некорректный S3-ключ/,
    );
    assert.deepEqual(removed, [key]);

    await assert.rejects(
        deleteCategoryIcon(key, 'travel', async (candidate) => {
            removed.push(candidate);
        }),
        /Некорректный S3-ключ/,
    );
    assert.deepEqual(removed, [key]);
});
