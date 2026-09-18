import 'server-only';

import {prisma} from '@/src/lib/prisma';

export function getCategoryForEdit(id: string) {
    return prisma.category.findUnique({
        where: {id},
        select: {
            id: true,
            slug: true,
            title: true,
            description: true,
        },
    });
}
