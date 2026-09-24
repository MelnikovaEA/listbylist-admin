import assert from 'node:assert/strict';
import test from 'node:test';
import {
    getCategoryIconIntent,
    updateCategoryFromForm,
    type CategoryIconIntent,
} from './action';

function createValidFormData(): FormData {
    const formData = new FormData();
    formData.set('title', '  Обновлённая категория  ');
    formData.set('description', '  Обновлённое описание.  ');
    return formData;
}

test('getCategoryIconIntent returns unchanged without an uploaded file or removal request', () => {
    assert.deepEqual(getCategoryIconIntent(createValidFormData()), {
        success: true,
        intent: {type: 'unchanged'},
    });
});

test('getCategoryIconIntent returns replace with the uploaded file without validating its content', () => {
    const formData = createValidFormData();
    const icon = new File(['PNG content is validated later'], 'icon.png', {
        type: 'application/octet-stream',
    });
    formData.set('icon', icon);

    const result = getCategoryIconIntent(formData);

    assert.equal(result.success, true);
    if (result.success) {
        assert.equal(result.intent.type, 'replace');
        if (result.intent.type === 'replace') {
            assert.equal(result.intent.file, icon);
        }
    }
});

test('getCategoryIconIntent returns remove only for an explicit removal request', () => {
    const formData = createValidFormData();
    formData.set('removeIcon', 'true');

    assert.deepEqual(getCategoryIconIntent(formData), {
        success: true,
        intent: {type: 'remove'},
    });
});

test('updateCategoryFromForm rejects simultaneous replacement and removal', async () => {
    const formData = createValidFormData();
    formData.set('icon', new File(['icon'], 'icon.png', {type: 'image/png'}));
    formData.set('removeIcon', 'true');
    let saveCalls = 0;

    const result = await updateCategoryFromForm(
        'category-id',
        formData,
        async () => {
            saveCalls += 1;
            return {id: 'category-id', slug: 'seasonal', title: 'Категория', warnings: []};
        },
    );

    assert.equal(saveCalls, 0);
    assert.deepEqual(result, {
        success: false,
        fieldErrors: {},
        formErrors: ['Нельзя одновременно загрузить новую и удалить текущую иконку.'],
        values: {
            title: '  Обновлённая категория  ',
            description: '  Обновлённое описание.  ',
        },
    });
});

test('updateCategoryFromForm updates title and description through the category editor', async () => {
    const formData = createValidFormData();
    const calls: Array<{
        id: string;
        values: {title: string; description: string};
        iconIntent: CategoryIconIntent;
    }> = [];

    const result = await updateCategoryFromForm(
        'category-id',
        formData,
        async (id, values, iconIntent) => {
            calls.push({id, values, iconIntent});
            return {
                id,
                slug: 'seasonal',
                title: values.title,
                warnings: ['cleanup warning'],
            };
        },
    );

    assert.deepEqual(calls, [{
        id: 'category-id',
        values: {
            title: 'Обновлённая категория',
            description: 'Обновлённое описание.',
        },
        iconIntent: {type: 'unchanged'},
    }]);
    assert.deepEqual(result, {
        success: true,
        title: 'Обновлённая категория',
        slug: 'seasonal',
        warnings: ['cleanup warning'],
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
            return {id: 'category-id', slug: 'seasonal', title: 'Сезонные', warnings: []};
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

test('updateCategoryFromForm logs the original save error and returns a generic form error', async () => {
    const saveError = new AggregateError(
        [new Error('database failed'), new Error('rollback failed')],
        'save failed',
    );
    const logged: Array<{message: string; error: unknown}> = [];

    const result = await updateCategoryFromForm(
        'category-id',
        createValidFormData(),
        async () => {
            throw saveError;
        },
        (message, error) => {
            logged.push({message, error});
        },
    );

    assert.equal(result.success, false);
    assert.equal(logged.length, 1);
    assert.match(logged[0].message, /category-id/);
    assert.equal(logged[0].error, saveError);

    if (!result.success) {
        assert.deepEqual(result.formErrors, ['Не удалось обновить категорию.']);
    }
});
