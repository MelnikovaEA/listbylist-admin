import 'server-only';

import type {CategoryFormValues} from '../form/schema';
import {
    cleanupCategoryIcon,
    replaceCategoryIcon,
} from './categoryIconLifecycle';

export type CategoryIconIntent =
    | {type: 'unchanged'}
    | {type: 'replace'; file: File}
    | {type: 'remove'};

type CategoryRecord = {
    id: string;
    slug: string;
    iconKey: string | null;
};

type UpdatedCategory = {
    id: string;
    slug: string;
    title: string;
};

type UpdateCategoryDependencies = {
    findRecord: (id: string) => Promise<CategoryRecord | null>;
    updateRecord: (
        id: string,
        values: CategoryFormValues,
        iconKey: string | null | undefined,
    ) => Promise<UpdatedCategory>;
    replaceIcon: typeof replaceCategoryIcon;
    cleanupIcon: typeof cleanupCategoryIcon;
};

const defaultDependencies: UpdateCategoryDependencies = {
    async findRecord(id) {
        const {prisma} = await import('@/src/lib/prisma');

        return prisma.category.findUnique({
            where: {id},
            select: {
                id: true,
                slug: true,
                iconKey: true,
            },
        });
    },
    async updateRecord(id, values, iconKey) {
        const {prisma} = await import('@/src/lib/prisma');

        return prisma.category.update({
            where: {id},
            data: {
                title: values.title,
                description: values.description,
                ...(iconKey !== undefined ? {iconKey} : {}),
            },
            select: {
                id: true,
                slug: true,
                title: true,
            },
        });
    },
    replaceIcon: replaceCategoryIcon,
    cleanupIcon: cleanupCategoryIcon,
};

async function getExistingCategory(
    id: string,
    dependencies: UpdateCategoryDependencies,
): Promise<CategoryRecord> {
    const category = await dependencies.findRecord(id);

    if (!category) {
        throw new Error('Категория не найдена.');
    }

    return category;
}

export async function updateCategory(
    id: string,
    values: CategoryFormValues,
    iconIntent: CategoryIconIntent,
    dependencies: UpdateCategoryDependencies = defaultDependencies,
) {
    if (iconIntent.type === 'unchanged') {
        const category = await dependencies.updateRecord(id, values, undefined);
        return {...category, warnings: []};
    }

    const existingCategory = await getExistingCategory(id, dependencies);

    if (iconIntent.type === 'remove') {
        const category = await dependencies.updateRecord(id, values, null);
        const warnings = await dependencies.cleanupIcon(
            existingCategory.iconKey,
            existingCategory.slug,
        );

        return {...category, warnings};
    }

    return dependencies.replaceIcon({
        file: iconIntent.file,
        slug: existingCategory.slug,
        previousIconKey: existingCategory.iconKey,
        updateRecord: (newIconKey) =>
            dependencies.updateRecord(id, values, newIconKey),
    });
}
