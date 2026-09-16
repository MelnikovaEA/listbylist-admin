import assert from 'node:assert/strict';
import test from 'node:test';
import type {CategoryOption} from '@/src/features/categories/model/categoryOption';
import {filterCategoryOptions, findCategoryOption} from '../../../model/categoryCombobox';

const categories: CategoryOption[] = [
    {id: '1', slug: 'home', title: 'Дом', description: 'Для дома'},
    {id: '2', slug: 'seasonal', title: 'Сезонные', description: 'По сезонам'},
    {id: '3', slug: 'travel', title: 'Путешествия', description: 'Для поездок'},
];

test('filterCategoryOptions filters locally by slug or title', () => {
    assert.deepEqual(
        filterCategoryOptions(categories, 'sea').map((category) => category.slug),
        ['seasonal'],
    );
    assert.deepEqual(
        filterCategoryOptions(categories, 'ПУТЕШ').map((category) => category.slug),
        ['travel'],
    );
});

test('findCategoryOption recognizes an existing normalized slug', () => {
    assert.equal(findCategoryOption(categories, ' SEASONAL ')?.title, 'Сезонные');
    assert.equal(findCategoryOption(categories, 'new-category'), undefined);
});
