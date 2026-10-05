import assert from 'node:assert/strict';
import test from 'node:test';
import {
    validateChecklistForm,
} from './validation';

function createValidFormData(): FormData {
    const formData = new FormData();
    formData.set('title', '  Летний пикник  ');
    formData.set('slug', '  LETNIY-PIKNIK  ');
    formData.set('categorySlug', '  SEASONAL  ');
    formData.set('categoryTitle', '  Сезонные  ');
    formData.set('categoryDescription', '');
    formData.set('subtitle', '  На природе  ');
    formData.set('intro', '  Короткое вступление  ');
    formData.set('description', '  Подробное описание  ');
    formData.set('seoTitle', '  SEO title  ');
    formData.set('seoDescription', '  SEO description  ');
    formData.set('status', 'PUBLISHED');
    formData.set('items', ' Плед \n\n Вода\r\n Салфетки ');
    formData.set('tags', ' лето, пикник, , список вещей ');
    return formData;
}

test('validateChecklistForm validates and normalizes the complete form', () => {
    const result = validateChecklistForm(createValidFormData());

    assert.equal(result.success, true);

    if (!result.success) {
        return;
    }

    assert.equal(result.data.title, 'Летний пикник');
    assert.equal(result.data.slug, 'letniy-piknik');
    assert.equal(result.data.categorySlug, 'seasonal');
    assert.equal(result.data.subtitle, 'На природе');
    assert.equal(result.data.status, 'PUBLISHED');
    assert.deepEqual(result.data.items, ['Плед', 'Вода', 'Салфетки']);
    assert.deepEqual(result.data.tags, ['лето', 'пикник', 'список вещей']);
});

test('validateChecklistForm preserves description paragraphs and line breaks', () => {
    for (const newline of ['\n', '\r\n']) {
        const formData = createValidFormData();
        const description = ['Первый абзац.', '', 'Второй абзац.', 'Продолжение второго абзаца.'].join(newline);
        formData.set('description', `  ${description}  `);

        const result = validateChecklistForm(formData);

        assert.equal(result.success, true);
        assert.equal(result.success ? result.data.description : null, description);
    }
});

test('validateChecklistForm creates the default category description', () => {
    const result = validateChecklistForm(createValidFormData());

    assert.equal(result.success, true);
    assert.equal(
        result.success ? result.data.categoryDescription : null,
        'Чек-листы из категории «Сезонные».',
    );
});

test('validateChecklistForm preserves a custom category description', () => {
    const formData = createValidFormData();
    formData.set('categoryDescription', '  Пользовательское описание.  ');
    const result = validateChecklistForm(formData);

    assert.equal(result.success, true);
    assert.equal(
        result.success ? result.data.categoryDescription : null,
        'Пользовательское описание.',
    );
});

test('validateChecklistForm maps validation messages to form fields', () => {
    const formData = createValidFormData();
    formData.set('title', '');
    formData.set('slug', 'летний-пикник');
    formData.set('status', 'UNKNOWN');
    formData.set('items', '\n');

    const result = validateChecklistForm(formData);

    assert.equal(result.success, false);

    if (result.success) {
        return;
    }

    assert.deepEqual(result.fieldErrors, {
        title: ['Заполни название чек-листа.'],
        slug: ['Slug чек-листа должен быть латиницей: letniy-piknik.'],
        status: ['Выбери допустимый статус чек-листа.'],
        items: ['Добавь хотя бы один пункт чек-листа.'],
    });
    assert.deepEqual(result.formErrors, []);
});

test('validateChecklistForm returns raw values so the UI can restore the form', () => {
    const formData = createValidFormData();
    formData.set('title', '  Введённое название  ');
    formData.set('slug', 'неверный-slug');

    const result = validateChecklistForm(formData);

    assert.equal(result.success, false);

    if (result.success) {
        return;
    }

    assert.equal(result.values.title, '  Введённое название  ');
    assert.equal(result.values.slug, 'неверный-slug');
});
