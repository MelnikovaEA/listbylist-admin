import 'server-only';

import {prisma} from '@/src/lib/prisma';
import type {CategoryListItem} from '../model/categoryListItem';

export async function getCategoryListItems(): Promise<CategoryListItem[]> {
    const categories = await prisma.category.findMany({
        orderBy: {slug: 'asc'},
        select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {checklists: true},
            },
        },
    });

    return categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        title: category.title,
        description: category.description,
        checklistCount: category._count.checklists,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
    }));
}
