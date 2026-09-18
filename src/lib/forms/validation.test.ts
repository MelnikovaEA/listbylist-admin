import assert from 'node:assert/strict';
import test from 'node:test';
import {collectFormValidationErrors, getFormString} from './validation';

test('getFormString returns only string FormData values', () => {
    const formData = new FormData();
    formData.set('title', 'Example');
    formData.set('image', new File(['content'], 'image.png'));

    assert.equal(getFormString(formData, 'title'), 'Example');
    assert.equal(getFormString(formData, 'image'), '');
    assert.equal(getFormString(formData, 'missing'), '');
});

test('collectFormValidationErrors separates and deduplicates field and form errors', () => {
    const result = collectFormValidationErrors([
        {path: ['title'], message: 'Заполни название.'},
        {path: ['title'], message: 'Заполни название.'},
        {path: ['description'], message: 'Заполни описание.'},
        {path: [], message: 'Форма заполнена неверно.'},
        {path: ['unknown'], message: 'Форма заполнена неверно.'},
    ], {
        title: '',
        description: '',
    });

    assert.deepEqual(result, {
        fieldErrors: {
            title: ['Заполни название.'],
            description: ['Заполни описание.'],
        },
        formErrors: ['Форма заполнена неверно.'],
    });
});
