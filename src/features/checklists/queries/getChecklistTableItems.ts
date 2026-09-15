import 'server-only';

import {prisma} from '@/src/lib/prisma';
import type {ChecklistTableItem} from '../model/checklistTableItem';
import {getChecklistAssetLinks} from '../files/links';
import {getChecklistPreviewUrl} from './checklistPreview';

export async function getChecklistTableItems(): Promise<ChecklistTableItem[]> {
    const checklists = await prisma.checklist.findMany({
        orderBy: {updatedAt: 'desc'},
        include: {
            category: {select: {title: true}},
            items: {
                orderBy: {sortOrder: 'asc'},
                select: {id: true, text: true},
            },
            tags: {
                include: {
                    tag: {select: {id: true, title: true}},
                },
            },
            assets: {
                select: {
                    type: true,
                    url: true,
                },
            },
        },
    });

    return checklists.map((checklist) => ({
        id: checklist.id,
        slug: checklist.slug,
        title: checklist.title,
        previewUrl: getChecklistPreviewUrl(
            checklist.assets.filter((asset) => asset.type === 'PREVIEW_IMAGE'),
        ),
        files: getChecklistAssetLinks(checklist.slug, checklist.assets),
        subtitle: checklist.subtitle,
        intro: checklist.intro,
        description: checklist.description,
        seoTitle: checklist.seoTitle,
        seoDescription: checklist.seoDescription,
        status: checklist.status,
        categoryId: checklist.categoryId,
        categoryTitle: checklist.category.title,
        tags: checklist.tags.map(({tag}) => tag),
        items: checklist.items,
        publishedAt: checklist.publishedAt,
        createdAt: checklist.createdAt,
        updatedAt: checklist.updatedAt,
    }));
}
