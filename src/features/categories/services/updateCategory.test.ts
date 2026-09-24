import assert from 'node:assert/strict';
import test from 'node:test';
import {updateCategory} from './updateCategory';

type Dependencies = NonNullable<Parameters<typeof updateCategory>[3]>;

const values = {
    title: 'Новое название',
    description: 'Новое описание',
};

const existingCategory = {
    id: 'category-id',
    slug: 'immutable-slug',
    iconKey: 'categories/immutable-slug/old-version/icon.png',
};

function createDependencies(
    overrides: Partial<Dependencies> = {},
): Dependencies {
    return {
        async findRecord() {
            return existingCategory;
        },
        async updateRecord(id, updateValues) {
            return {id, slug: existingCategory.slug, title: updateValues.title};
        },
        async replaceIcon(input) {
            const category = await input.updateRecord(
                'categories/immutable-slug/new-version/icon.png',
            );
            return {...category, warnings: []};
        },
        async cleanupIcon() {
            return [];
        },
        ...overrides,
    };
}

test('unchanged updates only title and description without reading or changing iconKey', async () => {
    const updates: Array<{id: string; iconKey: string | null | undefined}> = [];
    let findCalls = 0;

    const result = await updateCategory(
        'category-id',
        values,
        {type: 'unchanged'},
        createDependencies({
            async findRecord() {
                findCalls += 1;
                return existingCategory;
            },
            async updateRecord(id, updateValues, iconKey) {
                assert.deepEqual(updateValues, values);
                updates.push({id, iconKey});
                return {id, slug: existingCategory.slug, title: updateValues.title};
            },
        }),
    );

    assert.equal(findCalls, 0);
    assert.deepEqual(updates, [{id: 'category-id', iconKey: undefined}]);
    assert.deepEqual(result, {
        id: 'category-id',
        slug: 'immutable-slug',
        title: 'Новое название',
        warnings: [],
    });
});

test('replace delegates immutable slug, previous key and the database update callback', async () => {
    const file = new File(['source'], 'icon.png', {type: 'image/png'});
    const newKey = 'categories/immutable-slug/new-version/icon.png';
    const calls: string[] = [];

    const result = await updateCategory(
        'category-id',
        values,
        {type: 'replace', file},
        createDependencies({
            async replaceIcon(input) {
                assert.equal(input.file, file);
                assert.equal(input.slug, 'immutable-slug');
                assert.equal(input.previousIconKey, existingCategory.iconKey);
                calls.push('replace');
                const category = await input.updateRecord(newKey);
                return {...category, warnings: ['cleanup warning']};
            },
            async updateRecord(id, updateValues, iconKey) {
                assert.deepEqual({id, updateValues, iconKey}, {
                    id: 'category-id',
                    updateValues: values,
                    iconKey: newKey,
                });
                calls.push('database');
                return {id, slug: 'immutable-slug', title: updateValues.title};
            },
        }),
    );

    assert.deepEqual(calls, ['replace', 'database']);
    assert.deepEqual(result.warnings, ['cleanup warning']);
});

test('remove clears iconKey in the database before cleaning up the previous icon', async () => {
    const calls: string[] = [];

    const result = await updateCategory(
        'category-id',
        values,
        {type: 'remove'},
        createDependencies({
            async updateRecord(id, updateValues, iconKey) {
                assert.equal(iconKey, null);
                calls.push('database');
                return {id, slug: 'immutable-slug', title: updateValues.title};
            },
            async cleanupIcon(key, slug) {
                assert.equal(key, existingCategory.iconKey);
                assert.equal(slug, 'immutable-slug');
                calls.push('cleanup');
                return ['cleanup warning'];
            },
        }),
    );

    assert.deepEqual(calls, ['database', 'cleanup']);
    assert.deepEqual(result.warnings, ['cleanup warning']);
});

test('remove does not start cleanup when the database update fails', async () => {
    const databaseError = new Error('database failed');
    let cleanupCalls = 0;

    await assert.rejects(
        updateCategory(
            'category-id',
            values,
            {type: 'remove'},
            createDependencies({
                async updateRecord() {
                    throw databaseError;
                },
                async cleanupIcon() {
                    cleanupCalls += 1;
                    return [];
                },
            }),
        ),
        databaseError,
    );

    assert.equal(cleanupCalls, 0);
});
