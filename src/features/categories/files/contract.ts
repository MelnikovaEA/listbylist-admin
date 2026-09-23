export type ParsedCategoryIconKey = {
    slug: string;
    version: string;
};

function isPathSegment(value: string): boolean {
    return value !== '' && value !== '.' && value !== '..' && !value.includes('/');
}

export function getCategoryIconKey(slug: string, version: string): string {
    if (!isPathSegment(slug) || !isPathSegment(version)) {
        throw new Error('Некорректный slug или version для иконки категории.');
    }

    return `categories/${slug}/${version}/icon.png`;
}

export function parseCategoryIconKey(key: string): ParsedCategoryIconKey | null {
    const [root, slug, version, fileName, ...extraSegments] = key.split('/');

    if (
        root !== 'categories' ||
        !slug ||
        !version ||
        !isPathSegment(slug) ||
        !isPathSegment(version) ||
        fileName !== 'icon.png' ||
        extraSegments.length > 0
    ) {
        return null;
    }

    return {slug, version};
}
