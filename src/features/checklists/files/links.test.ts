import assert from 'node:assert/strict';
import test, {after} from 'node:test';
import {getChecklistAssetLinks} from './links';

const originalBucket = process.env.S3_BUCKET;
const originalAssetBaseUrl = process.env.ASSET_BASE_URL;

process.env.S3_BUCKET = 'test-bucket';
process.env.ASSET_BASE_URL = 'https://files.example.com/';

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

test('getChecklistAssetLinks presents all files from the active versioned bundle', () => {
    const links = getChecklistAssetLinks('summer-picnic', [{
        type: 'DOWNLOAD_IMAGE',
        url: 'checklists/summer-picnic/active-version/checklist.png',
    }]);

    assert.deepEqual(links, [
        'preview-400.webp',
        'preview-640.webp',
        'preview-960.webp',
        'view.webp',
        'checklist.png',
        'checklist.pdf',
    ].map((name) => ({
        name,
        url: `https://files.example.com/checklists/summer-picnic/active-version/${name}`,
    })));
});

test('getChecklistAssetLinks returns no fallback links for legacy data', () => {
    assert.deepEqual(getChecklistAssetLinks('summer-picnic', [{
        type: 'DOWNLOAD_IMAGE',
        url: '/checklists/summer-picnic/checklist.png',
    }]), []);
});

test('getChecklistAssetLinks rejects a bundle belonging to another checklist', () => {
    assert.deepEqual(getChecklistAssetLinks('summer-picnic', [{
        type: 'DOWNLOAD_IMAGE',
        url: 'checklists/other-checklist/active-version/checklist.png',
    }]), []);
});

test('getChecklistAssetLinks returns no links without an active download image', () => {
    assert.deepEqual(getChecklistAssetLinks('summer-picnic', [{
        type: 'PDF',
        url: 'checklists/summer-picnic/active-version/checklist.pdf',
    }]), []);
});
