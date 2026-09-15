import assert from 'node:assert/strict';
import test from 'node:test';
import {deleteObjectsByPrefix} from './objectStorage';

test('deleteObjectsByPrefix deletes objects from every paginated page', async () => {
    const requestedTokens: Array<string | undefined> = [];
    const removedKeys: string[] = [];

    await deleteObjectsByPrefix('checklists/test/', {
        async listPage(prefix, continuationToken) {
            assert.equal(prefix, 'checklists/test/');
            requestedTokens.push(continuationToken);

            return continuationToken
                ? {
                    keys: [
                        'checklists/test/v2/checklist.png',
                        'checklists/test/v2/checklist.pdf',
                    ],
                }
                : {
                    keys: [
                        'checklists/test/v1/checklist.png',
                        'checklists/test/v1/checklist.pdf',
                    ],
                    nextContinuationToken: 'next-page',
                };
        },
        async remove(key) {
            removedKeys.push(key);
        },
    });

    assert.deepEqual(requestedTokens, [undefined, 'next-page']);
    assert.deepEqual(removedKeys.sort(), [
        'checklists/test/v1/checklist.pdf',
        'checklists/test/v1/checklist.png',
        'checklists/test/v2/checklist.pdf',
        'checklists/test/v2/checklist.png',
    ]);
});

test('deleteObjectsByPrefix accepts an empty or already deleted prefix', async () => {
    let removeCalls = 0;

    await deleteObjectsByPrefix('checklists/test/', {
        async listPage() {
            return {keys: []};
        },
        async remove() {
            removeCalls += 1;
        },
    });

    assert.equal(removeCalls, 0);
});

test('deleteObjectsByPrefix attempts all objects and reports partial failures', async () => {
    const removedKeys: string[] = [];

    await assert.rejects(
        deleteObjectsByPrefix('checklists/test/', {
            async listPage() {
                return {keys: [
                    'checklists/test/first',
                    'checklists/test/failed',
                    'checklists/test/last',
                ]};
            },
            async remove(key) {
                removedKeys.push(key);

                if (key === 'checklists/test/failed') {
                    throw new Error('simulated S3 failure');
                }
            },
        }),
        (error: AggregateError) => {
            assert.equal(error.errors.length, 1);
            assert.match(error.message, /checklists\/test\//);
            return true;
        },
    );

    assert.deepEqual(removedKeys.sort(), [
        'checklists/test/failed',
        'checklists/test/first',
        'checklists/test/last',
    ]);
});

test('deleteObjectsByPrefix rejects malformed generic prefixes', async () => {
    const operations = {
        async listPage() {
            throw new Error('list must not run');
        },
        async remove() {
            throw new Error('remove must not run');
        },
    };

    await assert.rejects(deleteObjectsByPrefix('', operations), /Некорректный prefix/);
    await assert.rejects(deleteObjectsByPrefix('checklists/', operations), /Некорректный prefix/);
    await assert.rejects(deleteObjectsByPrefix('/checklists/test/', operations), /Некорректный prefix/);
    await assert.rejects(deleteObjectsByPrefix('checklists/test', operations), /Некорректный prefix/);
    await assert.rejects(deleteObjectsByPrefix('checklists/../', operations), /Некорректный prefix/);
});

test('deleteObjectsByPrefix never deletes a key outside the requested prefix', async () => {
    let removeCalls = 0;

    await assert.rejects(
        deleteObjectsByPrefix('checklists/test/', {
            async listPage() {
                return {keys: ['checklists/other/version/checklist.png']};
            },
            async remove() {
                removeCalls += 1;
            },
        }),
        /за пределами удаляемого prefix/,
    );

    assert.equal(removeCalls, 0);
});
