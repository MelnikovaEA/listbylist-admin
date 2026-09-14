import 'server-only';

import {getPublicAssetUrl} from '@/src/lib/storage/objectStorage';

const checklistAssetFileNames = new Set([
    'preview-400.webp',
    'preview-640.webp',
    'preview-960.webp',
    'view.webp',
    'checklist.png',
    'checklist.pdf',
]);

function isPathSegment(value: string): boolean {
    return value !== '' && value !== '.' && value !== '..';
}

export function getChecklistAssetPublicUrl(
    storedUrl: string,
): string | null {
    const [directory, slug, version, fileName, ...extraSegments] = storedUrl.split('/');

    if (
        directory !== 'checklists' ||
        !isPathSegment(slug) ||
        !isPathSegment(version) ||
        !fileName ||
        extraSegments.length > 0 ||
        !checklistAssetFileNames.has(fileName)
    ) {
        return null;
    }

    return getPublicAssetUrl(storedUrl);
}
