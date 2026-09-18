import assert from 'node:assert/strict';
import test from 'node:test';
import {updateCategory} from './updateCategory';

test('updateCategory changes title and description without accepting a slug', async () => {
    const calls: Array<{
        id: string;
        values: {title: string; description: string};
    }> = [];

    const result = await updateCategory(
        'category-id',
        {title: 'Новое название', description: 'Новое описание'},
        {
            async updateRecord(id, values) {
                calls.push({id, values});
                return {id, slug: 'immutable-slug', title: values.title};
            },
        },
    );

    assert.deepEqual(calls, [{
        id: 'category-id',
        values: {title: 'Новое название', description: 'Новое описание'},
    }]);
    assert.equal(result.slug, 'immutable-slug');
});
