import 'server-only';

import {prisma} from '@/src/lib/prisma';
import type {CategoryOption} from '../model/categoryOption';

export function getCategoryOptions(): Promise<CategoryOption[]> {
    return prisma.category.findMany({
        orderBy: {slug: 'asc'},
        select: {
            id: true,
            slug: true,
            title: true,
            description: true,
        },
    });
}
