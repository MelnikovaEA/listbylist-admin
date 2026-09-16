import assert from 'node:assert/strict';
import test from 'node:test';
import {resolveChecklistCategory} from './resolveChecklistCategory';

type UpsertArguments = {
    where: {slug: string};
    update: Record<string, never>;
    create: {slug: string; title: string; description: string};
};

function createClient(
    onUpsert: (arguments_: UpsertArguments) => Promise<{id: string}>,
) {
    return {
        category: {
            upsert(arguments_: UpsertArguments) {
                return onUpsert(arguments_);
            },
        },
    };
}

test('existing category metadata cannot be overwritten by checklist values', async () => {
    let receivedArguments: UpsertArguments | undefined;
    const existingCategory = {
        id: 'category-id',
        slug: 'seasonal',
        title: 'Сезонные',
        description: 'Существующее описание',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const client = createClient((arguments_) => {
        receivedArguments = arguments_;
        return Promise.resolve(existingCategory);
    });

    const category = await resolveChecklistCategory(client, {
        slug: 'seasonal',
        title: 'Подменённое название',
        description: 'Подменённое описание',
    });

    assert.deepEqual(receivedArguments?.update, {});
    assert.deepEqual(receivedArguments?.create, {
        slug: 'seasonal',
        title: 'Подменённое название',
        description: 'Подменённое описание',
    });
    assert.equal(category, existingCategory);
});

test('new category is created from validated checklist values', async () => {
    let receivedArguments: UpsertArguments | undefined;
    const client = createClient((arguments_) => {
        receivedArguments = arguments_;
        return Promise.resolve({
            id: 'new-category-id',
            slug: 'travel',
            title: 'Путешествия',
            description: 'Чек-листы для путешествий',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    });

    await resolveChecklistCategory(client, {
        slug: 'travel',
        title: 'Путешествия',
        description: 'Чек-листы для путешествий',
    });

    assert.deepEqual(receivedArguments?.where, {slug: 'travel'});
    assert.deepEqual(receivedArguments?.create, {
        slug: 'travel',
        title: 'Путешествия',
        description: 'Чек-листы для путешествий',
    });
});
