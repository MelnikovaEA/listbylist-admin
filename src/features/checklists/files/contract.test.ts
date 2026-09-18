import assert from 'node:assert/strict';
import test from 'node:test';
import {
    getChecklistAssetBundleReference,
    getChecklistAssetKey,
    parseChecklistAssetKey,
} from './contract';

test('getChecklistAssetBundleReference restores every key from the active version', () => {
    const bundle = getChecklistAssetBundleReference(
        'checklists/test-checklist/test-version/checklist.png',
    );

    assert.deepEqual(bundle, {
        slug: 'test-checklist',
        version: 'test-version',
        assets: [
            'preview-400.webp',
            'preview-640.webp',
            'preview-960.webp',
            'view.webp',
            'checklist.png',
            'checklist.pdf',
        ].map((fileName) => ({
            key: `checklists/test-checklist/test-version/${fileName}`,
        })),
    });
});

test('parseChecklistAssetKey accepts only known files in a versioned checklist directory', () => {
    assert.deepEqual(
        parseChecklistAssetKey('checklists/test-checklist/test-version/view.webp'),
        {
            slug: 'test-checklist',
            version: 'test-version',
            fileName: 'view.webp',
        },
    );
    assert.equal(parseChecklistAssetKey('checklists/test-checklist/view.webp'), null);
    assert.equal(parseChecklistAssetKey('checklists/test-checklist/../view.webp'), null);
    assert.equal(parseChecklistAssetKey('checklists/test-checklist/test-version/other.webp'), null);
});

test('getChecklistAssetBundleReference requires the versioned checklist.png key', () => {
    assert.equal(
        getChecklistAssetBundleReference('/checklists/test-checklist/checklist.png'),
        null,
    );
    assert.equal(
        getChecklistAssetBundleReference('checklists/test-checklist/checklist.png'),
        null,
    );
    assert.equal(
        getChecklistAssetBundleReference('checklists/test-checklist/test-version/view.webp'),
        null,
    );
});

test('getChecklistAssetKey rejects unsafe path segments', () => {
    assert.throws(
        () => getChecklistAssetKey('test-checklist', '..', 'view.webp'),
        /Некорректный slug или version/,
    );
    assert.throws(
        () => getChecklistAssetKey('other/checklist', 'test-version', 'view.webp'),
        /Некорректный slug или version/,
    );
});
