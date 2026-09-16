import type {CategoryOption} from '@/src/features/categories/model/categoryOption';
import {normalizeSlug} from './slug';

export function filterCategoryOptions(
    categories: ReadonlyArray<CategoryOption>,
    query: string,
): CategoryOption[] {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
        return [...categories];
    }

    return categories.filter((category) =>
        category.slug.includes(normalizedQuery) ||
        category.title.toLowerCase().includes(normalizedQuery),
    );
}

export function findCategoryOption(
    categories: ReadonlyArray<CategoryOption>,
    slug: string,
): CategoryOption | undefined {
    const normalizedSlug = normalizeSlug(slug);

    return categories.find((category) => category.slug === normalizedSlug);
}
