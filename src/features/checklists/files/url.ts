import 'server-only';

import {getPublicAssetUrl} from '@/src/lib/storage/objectStorage';
import {parseChecklistAssetKey} from './contract';

export function getChecklistAssetPublicUrl(
    storedUrl: string,
): string | null {
    if (!parseChecklistAssetKey(storedUrl)) {
        return null;
    }

    return getPublicAssetUrl(storedUrl);
}
