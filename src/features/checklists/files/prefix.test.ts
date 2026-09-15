import assert from 'node:assert/strict';
import test from 'node:test';
import {getChecklistStoragePrefix} from './prefix';

test('getChecklistStoragePrefix builds a prefix for one checklist', () => {
    assert.equal(
        getChecklistStoragePrefix('summer-picnic'),
        'checklists/summer-picnic/',
    );
});

test('getChecklistStoragePrefix cannot target the checklist root or another slug', () => {
    for (const slug of ['', '.', '..', 'other/slug', '../other', 'summer-picnic/..']) {
        assert.throws(
            () => getChecklistStoragePrefix(slug),
            /Некорректный slug чек-листа/,
        );
    }
});
