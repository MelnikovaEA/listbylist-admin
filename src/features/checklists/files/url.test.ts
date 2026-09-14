import assert from 'node:assert/strict';
import test, {after} from 'node:test';
import {getChecklistAssetPublicUrl} from './url';

const originalBucket = process.env.S3_BUCKET;
const originalAssetBaseUrl = process.env.ASSET_BASE_URL;

after(() => {
    if (originalBucket === undefined) {
        delete process.env.S3_BUCKET;
    } else {
        process.env.S3_BUCKET = originalBucket;
    }

    if (originalAssetBaseUrl === undefined) {
        delete process.env.ASSET_BASE_URL;
    } else {
        process.env.ASSET_BASE_URL = originalAssetBaseUrl;
    }
});

test('getChecklistAssetPublicUrl resolves a versioned S3 key', () => {
    process.env.S3_BUCKET = 'test-bucket';
    process.env.ASSET_BASE_URL = 'https://files.example.com/';

    assert.equal(
        getChecklistAssetPublicUrl('checklists/test/version/preview-960.webp'),
        'https://files.example.com/checklists/test/version/preview-960.webp',
    );
});

test('getChecklistAssetPublicUrl ignores a legacy asset path', () => {
    assert.equal(
        getChecklistAssetPublicUrl('/checklists/test/preview-960.webp'),
        null,
    );
    assert.equal(
        getChecklistAssetPublicUrl('checklists/test/preview-960.webp'),
        null,
    );
});

test('getChecklistAssetPublicUrl ignores malformed or unknown asset keys', () => {
    assert.equal(
        getChecklistAssetPublicUrl('checklists/test/version/other.webp'),
        null,
    );
    assert.equal(
        getChecklistAssetPublicUrl('checklists/test/../preview-960.webp'),
        null,
    );
    assert.equal(
        getChecklistAssetPublicUrl('checklists/test/version/preview-960.webp/extra'),
        null,
    );
});
