import assert from 'node:assert/strict';
import test from 'node:test';
import {validateCategoryForm} from './validation';

test('validateCategoryForm trims valid category values', () => {
    const formData = new FormData();
    formData.set('title', '  Сезонные  ');
    formData.set('description', '  Чек-листы по сезонам.  ');

    const result = validateCategoryForm(formData);

    assert.deepEqual(result, {
        success: true,
        data: {
            title: 'Сезонные',
            description: 'Чек-листы по сезонам.',
        },
    });
});

test('validateCategoryForm returns field errors and raw values', () => {
    const formData = new FormData();
    formData.set('title', '');
    formData.set('description', '   ');

    const result = validateCategoryForm(formData);

    assert.equal(result.success, false);

    if (!result.success) {
        assert.deepEqual(result.fieldErrors, {
            title: ['Заполни название категории.'],
            description: ['Заполни описание категории.'],
        });
        assert.deepEqual(result.values, {title: '', description: '   '});
    }
});
