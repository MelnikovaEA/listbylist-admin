export function normalizeSlug(value: string) {
    return value.trim().toLowerCase();
}

export function validateLatinSlug(slug: string) {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function normalizeTagSlug(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '');
}
