import 'server-only';

import type {CategoryFormValues} from '../form/schema';

type UpdateCategoryDependencies = {
    updateRecord: (
        id: string,
        values: CategoryFormValues,
    ) => Promise<{id: string; slug: string; title: string}>;
};

const defaultDependencies: UpdateCategoryDependencies = {
    async updateRecord(id, values) {
        const {prisma} = await import('@/src/lib/prisma');

        return prisma.category.update({
            where: {id},
            data: {
                title: values.title,
                description: values.description,
            },
            select: {
                id: true,
                slug: true,
                title: true,
            },
        });
    },
};

export function updateCategory(
    id: string,
    values: CategoryFormValues,
    dependencies: UpdateCategoryDependencies = defaultDependencies,
) {
    return dependencies.updateRecord(id, values);
}
