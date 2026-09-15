import assert from 'node:assert/strict';
import test from 'node:test';
import {
    CHECKLIST_FILES_CLEANUP_WARNING,
    deleteChecklist,
} from './deleteChecklist';

function createDependencies(overrides: Partial<Parameters<typeof deleteChecklist>[1]> = {}) {
    return {
        async findChecklist() {
            return {slug: 'summer-picnic'};
        },
        async deleteChecklistRecord() {},
        async deletePrefix() {},
        logCleanupError() {},
        ...overrides,
    };
}

test('deleteChecklist deletes the DB record before the complete S3 prefix', async () => {
    const calls: string[] = [];

    const result = await deleteChecklist('checklist-id', createDependencies({
        async findChecklist(id) {
            calls.push(`find:${id}`);
            return {slug: 'summer-picnic'};
        },
        async deleteChecklistRecord(id) {
            calls.push(`db:${id}`);
        },
        async deletePrefix(prefix) {
            calls.push(`s3:${prefix}`);
        },
    }));

    assert.deepEqual(calls, [
        'find:checklist-id',
        'db:checklist-id',
        's3:checklists/summer-picnic/',
    ]);
    assert.deepEqual(result, {deleted: true, warnings: []});
});

test('successful DB delete with failed S3 cleanup remains successful and logs a warning', async () => {
    const cleanupError = new Error('S3 unavailable');
    const loggedErrors: Array<{message: string; error: unknown}> = [];

    const result = await deleteChecklist('checklist-id', createDependencies({
        async deletePrefix() {
            throw cleanupError;
        },
        logCleanupError(message, error) {
            loggedErrors.push({message, error});
        },
    }));

    assert.deepEqual(result, {
        deleted: true,
        warnings: [CHECKLIST_FILES_CLEANUP_WARNING],
    });
    assert.equal(loggedErrors.length, 1);
    assert.match(loggedErrors[0].message, /checklists\/summer-picnic\//);
    assert.equal(loggedErrors[0].error, cleanupError);
});

test('failed DB delete does not start S3 cleanup', async () => {
    const databaseError = new Error('database failed');
    let cleanupCalls = 0;

    await assert.rejects(
        deleteChecklist('checklist-id', createDependencies({
            async deleteChecklistRecord() {
                throw databaseError;
            },
            async deletePrefix() {
                cleanupCalls += 1;
            },
        })),
        databaseError,
    );

    assert.equal(cleanupCalls, 0);
});

test('missing checklist is a no-op and does not start DB or S3 deletion', async () => {
    let deleteCalls = 0;
    const result = await deleteChecklist('missing', createDependencies({
        async findChecklist() {
            return null;
        },
        async deleteChecklistRecord() {
            deleteCalls += 1;
        },
        async deletePrefix() {
            deleteCalls += 1;
        },
    }));

    assert.deepEqual(result, {deleted: false, warnings: []});
    assert.equal(deleteCalls, 0);
});

test('unsafe stored slug prevents both DB and S3 deletion', async () => {
    let deleteCalls = 0;

    await assert.rejects(
        deleteChecklist('checklist-id', createDependencies({
            async findChecklist() {
                return {slug: '../other'};
            },
            async deleteChecklistRecord() {
                deleteCalls += 1;
            },
            async deletePrefix() {
                deleteCalls += 1;
            },
        })),
        /Некорректный slug чек-листа/,
    );

    assert.equal(deleteCalls, 0);
});
