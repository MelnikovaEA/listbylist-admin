import assert from 'node:assert/strict';
import test from 'node:test';
import type {ChecklistAssetBundle} from '../files/bundle';
import type {ChecklistAssetBundleReference} from '../files/contract';
import type {
    ChecklistFileState,
    SavedChecklistFiles,
} from './saveChecklistFiles';
import {
    applyChecklistAssetChanges,
    cleanupPreviousChecklistBundle,
    PREVIOUS_BUNDLE_CLEANUP_WARNING,
    rollbackUploadedChecklistBundle,
} from './checklistAssetLifecycle';

const fileState: ChecklistFileState = {
    preview: {
        exists: true,
        url: 'checklists/test/new/preview-960.webp',
        sizeKb: 1,
        bytes: 1_024,
        width: 960,
        height: 1_344,
        mimeType: 'image/webp',
    },
    view: {
        exists: true,
        url: 'checklists/test/new/view.webp',
        sizeKb: 2,
        bytes: 2_048,
        width: 1_000,
        height: 1_400,
        mimeType: 'image/webp',
    },
    image: {
        exists: true,
        url: 'checklists/test/new/checklist.png',
        sizeKb: 3,
        bytes: 3_072,
        width: 1_000,
        height: 1_400,
        mimeType: 'image/png',
    },
    pdf: {
        exists: true,
        url: 'checklists/test/new/checklist.pdf',
        sizeKb: 1,
        bytes: 512,
        width: null,
        height: null,
        mimeType: 'application/pdf',
    },
};

const newBundle: ChecklistAssetBundle = {
    version: 'new',
    assets: [{
        role: 'DOWNLOAD_IMAGE',
        key: 'checklists/test/new/checklist.png',
        body: Buffer.from('new'),
        contentType: 'image/png',
        contentDisposition: 'inline',
        width: 1,
        height: 1,
        bytes: 3,
    }],
};
const previousBundle: ChecklistAssetBundleReference = {
    assets: [{key: 'checklists/test/previous/checklist.png'}],
};

test('unchanged edit does not invoke ChecklistAsset replacement', async () => {
    let deleteManyCalls = 0;
    let createManyCalls = 0;

    await applyChecklistAssetChanges({changed: false}, async () => {
        deleteManyCalls += 1;
        createManyCalls += 1;
    });

    assert.equal(deleteManyCalls, 0);
    assert.equal(createManyCalls, 0);
});

test('changed edit invokes ChecklistAsset replacement with the new file state', async () => {
    const savedFiles: SavedChecklistFiles = {
        changed: true,
        bundle: newBundle,
        fileState,
    };
    const receivedStates: ChecklistFileState[] = [];

    await applyChecklistAssetChanges(savedFiles, async (receivedState) => {
        receivedStates.push(receivedState);
    });

    assert.deepEqual(receivedStates, [fileState]);
});

test('database failure removes only the newly uploaded bundle and rethrows the database error', async () => {
    const databaseError = new Error('database failed');
    const deletedBundles: ChecklistAssetBundleReference[] = [];

    await assert.rejects(
        rollbackUploadedChecklistBundle(
            databaseError,
            newBundle,
            async (bundle) => {
                deletedBundles.push(bundle);
            },
        ),
        databaseError,
    );

    assert.deepEqual(deletedBundles, [newBundle]);
    assert.notEqual(deletedBundles[0], previousBundle);
});

test('database failure and new-bundle cleanup failure produce an AggregateError', async () => {
    const databaseError = new Error('database failed');
    const cleanupError = new Error('cleanup failed');

    await assert.rejects(
        rollbackUploadedChecklistBundle(
            databaseError,
            newBundle,
            async () => {
                throw cleanupError;
            },
        ),
        (error: AggregateError) => {
            assert.deepEqual(error.errors, [databaseError, cleanupError]);
            return true;
        },
    );
});

test('previous-bundle cleanup runs after commit and its failure is only logged', async () => {
    const cleanupError = new Error('old cleanup failed');
    const deletedBundles: ChecklistAssetBundleReference[] = [];
    const loggedErrors: Array<{message: string; error: unknown}> = [];

    const warnings = await cleanupPreviousChecklistBundle(
        newBundle,
        previousBundle,
        async (bundle) => {
            deletedBundles.push(bundle);
            throw cleanupError;
        },
        (message, error) => {
            loggedErrors.push({message, error});
        },
    );

    assert.deepEqual(deletedBundles, [previousBundle]);
    assert.equal(loggedErrors.length, 1);
    assert.equal(loggedErrors[0].error, cleanupError);
    assert.deepEqual(warnings, [PREVIOUS_BUNDLE_CLEANUP_WARNING]);
});

test('previous-bundle cleanup does nothing when either bundle is absent', async () => {
    let deleteCalls = 0;
    const deleteBundle = async () => {
        deleteCalls += 1;
    };
    const logCleanupError = () => {
        throw new Error('logger must not be called');
    };

    const warningsWithoutUploadedBundle = await cleanupPreviousChecklistBundle(
        null,
        previousBundle,
        deleteBundle,
        logCleanupError,
    );
    const warningsWithoutPreviousBundle = await cleanupPreviousChecklistBundle(
        newBundle,
        null,
        deleteBundle,
        logCleanupError,
    );

    assert.equal(deleteCalls, 0);
    assert.deepEqual(warningsWithoutUploadedBundle, []);
    assert.deepEqual(warningsWithoutPreviousBundle, []);
});
