import 'server-only';

import type {Prisma} from '@/generated/prisma/client';
import {getChecklistAssetPublicUrl} from '../files/url';

export const checklistPreviewAssetQuery = {
    where: {type: 'PREVIEW_IMAGE'},
    orderBy: {updatedAt: 'desc'},
    take: 1,
    select: {url: true},
} satisfies Prisma.Checklist$assetsArgs;

export function getChecklistPreviewUrl(
    assets: ReadonlyArray<{url: string}>,
): string | null {
    return assets[0]
        ? getChecklistAssetPublicUrl(assets[0].url)
        : null;
}
