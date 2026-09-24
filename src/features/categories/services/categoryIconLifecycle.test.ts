import assert from 'node:assert/strict';
import test from 'node:test';
import type {PreparedCategoryIcon} from '../files/icon';
import type {ValidatedCategoryIcon} from '../files/validation';
import {
    CATEGORY_ICON_CLEANUP_WARNING,
    replaceCategoryIcon,
} from './categoryIconLifecycle';

type Dependencies = NonNullable<Parameters<typeof replaceCategoryIcon>[1]>;

const validatedIcon: ValidatedCategoryIcon = {
    buffer: Buffer.from('validated'),
    width: 100,
    height: 80,
};

const preparedIcon: PreparedCategoryIcon = {
    key: 'categories/immutable-slug/new-version/icon.png',
    body: Buffer.from('prepared'),
    contentType: 'image/png',
    contentDisposition: 'inline',
    width: 512,
    height: 512,
    bytes: 8,
};

function createDependencies(
    overrides: Partial<Dependencies> = {},
): Dependencies {
    return {
        async validateIcon() {
            return validatedIcon;
        },
        createVersion() {
            return 'new-version';
        },
        async prepareIcon() {
            return preparedIcon;
        },
        async uploadIcon() {},
        async deleteIcon() {},
        logCleanupError() {},
        ...overrides,
    };
}

function createInput(overrides: Partial<Parameters<typeof replaceCategoryIcon>[0]> = {}) {
    return {
        file: new File(['source'], 'icon.png', {type: 'image/png'}),
        slug: 'immutable-slug',
        previousIconKey: null,
        async updateRecord() {
            return {
                id: 'category-id',
                slug: 'immutable-slug',
                title: 'Новое название',
            };
        },
        ...overrides,
    };
}

test('replacement validates, versions, prepares and uploads before the database update', async () => {
    const input = createInput();
    const calls: string[] = [];

    const result = await replaceCategoryIcon(
        {
            ...input,
            async updateRecord(newIconKey) {
                assert.equal(newIconKey, preparedIcon.key);
                calls.push('database');
                return input.updateRecord(newIconKey);
            },
        },
        createDependencies({
            async validateIcon(file) {
                assert.equal(file, input.file);
                calls.push('validate');
                return validatedIcon;
            },
            createVersion() {
                calls.push('version');
                return 'new-version';
            },
            async prepareIcon(slug, source, version) {
                assert.equal(slug, 'immutable-slug');
                assert.equal(source, validatedIcon);
                assert.equal(version, 'new-version');
                calls.push('prepare');
                return preparedIcon;
            },
            async uploadIcon(icon) {
                assert.equal(icon, preparedIcon);
                calls.push('upload');
            },
        }),
    );

    assert.deepEqual(calls, [
        'validate',
        'version',
        'prepare',
        'upload',
        'database',
    ]);
    assert.deepEqual(result.warnings, []);
});

test('replacement rolls back the newly uploaded icon when the database update fails', async () => {
    const databaseError = new Error('database failed');
    const deleted: Array<{key: string; slug: string}> = [];

    await assert.rejects(
        replaceCategoryIcon(
            createInput({
                async updateRecord() {
                    throw databaseError;
                },
            }),
            createDependencies({
                async deleteIcon(key, slug) {
                    deleted.push({key, slug});
                },
            }),
        ),
        databaseError,
    );

    assert.deepEqual(deleted, [{
        key: preparedIcon.key,
        slug: 'immutable-slug',
    }]);
});

test('replacement preserves database and rollback failures in an AggregateError', async () => {
    const databaseError = new Error('database failed');
    const rollbackError = new Error('rollback failed');

    await assert.rejects(
        replaceCategoryIcon(
            createInput({
                async updateRecord() {
                    throw databaseError;
                },
            }),
            createDependencies({
                async deleteIcon() {
                    throw rollbackError;
                },
            }),
        ),
        (error: AggregateError) => {
            assert.deepEqual(error.errors, [databaseError, rollbackError]);
            return true;
        },
    );
});

test('replacement removes the previous owned icon only after the database update succeeds', async () => {
    const oldKey = 'categories/immutable-slug/old-version/icon.png';
    const calls: string[] = [];

    await replaceCategoryIcon(
        createInput({
            previousIconKey: oldKey,
            async updateRecord(newIconKey) {
                assert.equal(newIconKey, preparedIcon.key);
                calls.push('database');
                return {
                    id: 'category-id',
                    slug: 'immutable-slug',
                    title: 'Новое название',
                };
            },
        }),
        createDependencies({
            async deleteIcon(key, slug) {
                calls.push(`delete:${key}:${slug}`);
            },
        }),
    );

    assert.deepEqual(calls, [
        'database',
        `delete:${oldKey}:immutable-slug`,
    ]);
});

test('cleanup failure after a successful database update returns a warning and logs the error', async () => {
    const cleanupError = new Error('cleanup failed');
    const logged: Array<{message: string; error: unknown}> = [];

    const result = await replaceCategoryIcon(
        createInput({
            previousIconKey: 'categories/immutable-slug/old-version/icon.png',
        }),
        createDependencies({
            async deleteIcon() {
                throw cleanupError;
            },
            logCleanupError(message, error) {
                logged.push({message, error});
            },
        }),
    );

    assert.deepEqual(result.warnings, [CATEGORY_ICON_CLEANUP_WARNING]);
    assert.equal(logged.length, 1);
    assert.match(logged[0].message, /immutable-slug/);
    assert.equal(logged[0].error, cleanupError);
});
