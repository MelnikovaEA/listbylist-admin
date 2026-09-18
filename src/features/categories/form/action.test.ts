import assert from 'node:assert/strict';
import test from 'node:test';
import {updateCategoryFromForm} from './action';

test('updateCategoryFromForm updates title and description through the category editor', async () => {
    const formData = new FormData();
    formData.set('title', '  Обновлённая категория  ');
    formData.set('description', '  Обновлённое описание.  ');
    const calls: Array<{
        id: string;
        values: {title: string; description: string};
    }> = [];

    const result = await updateCategoryFromForm(
        'category-id',
        formData,
        async (id, values) => {
            calls.push({id, values});
            return {id, slug: 'seasonal', title: values.title};
        },
    );

    assert.deepEqual(calls, [{
        id: 'category-id',
        values: {
            title: 'Обновлённая категория',
            description: 'Обновлённое описание.',
        },
    }]);
    assert.deepEqual(result, {
        success: true,
        title: 'Обновлённая категория',
        slug: 'seasonal',
    });
});

test('updateCategoryFromForm keeps field errors and does not call the service', async () => {
    const formData = new FormData();
    let saveCalls = 0;

    const result = await updateCategoryFromForm(
        'category-id',
        formData,
        async () => {
            saveCalls += 1;
            return {id: 'category-id', slug: 'seasonal', title: 'Сезонные'};
        },
    );

    assert.equal(saveCalls, 0);
    assert.equal(result.success, false);

    if (!result.success) {
        assert.deepEqual(result.fieldErrors, {
            title: ['Заполни название категории.'],
            description: ['Заполни описание категории.'],
        });
    }
});
