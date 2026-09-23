import assert from 'node:assert/strict';
import test from 'node:test';
import {
    getCategoryIconKey,
    parseCategoryIconKey,
} from './contract';

test('getCategoryIconKey builds a versioned category icon key', () => {
    assert.equal(
        getCategoryIconKey('seasonal', 'test-version'),
        'categories/seasonal/test-version/icon.png',
    );
});

test('getCategoryIconKey rejects unsafe path segments', () => {
    assert.throws(() => getCategoryIconKey('', 'version'));
    assert.throws(() => getCategoryIconKey('.', 'version'));
    assert.throws(() => getCategoryIconKey('..', 'version'));
    assert.throws(() => getCategoryIconKey('seasonal/summer', 'version'));
    assert.throws(() => getCategoryIconKey('seasonal', '../version'));
});

test('parseCategoryIconKey accepts only the exact category icon contract', () => {
    assert.deepEqual(
        parseCategoryIconKey('categories/seasonal/test-version/icon.png'),
        {slug: 'seasonal', version: 'test-version'},
    );
    assert.equal(parseCategoryIconKey('categories/seasonal/test-version/icon.webp'), null);
    assert.equal(parseCategoryIconKey('categories/seasonal/icon.png'), null);
    assert.equal(parseCategoryIconKey('categories/seasonal/test-version/icon.png/extra'), null);
    assert.equal(parseCategoryIconKey('checklists/seasonal/test-version/icon.png'), null);
});
