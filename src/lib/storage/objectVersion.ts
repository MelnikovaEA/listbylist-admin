import {randomUUID} from 'node:crypto';

export function createAssetVersion(): string {
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    return `${timestamp}-${randomUUID().slice(0, 8)}`;
}
