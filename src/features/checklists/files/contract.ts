export const checklistAssetDefinitions = [
    {role: 'PREVIEW_400', fileName: 'preview-400.webp'},
    {role: 'PREVIEW_640', fileName: 'preview-640.webp'},
    {role: 'PREVIEW_960', fileName: 'preview-960.webp'},
    {role: 'VIEW', fileName: 'view.webp'},
    {role: 'DOWNLOAD_IMAGE', fileName: 'checklist.png'},
    {role: 'PDF', fileName: 'checklist.pdf'},
] as const;

export type ChecklistAssetRole = typeof checklistAssetDefinitions[number]['role'];
export type ChecklistAssetFileName = typeof checklistAssetDefinitions[number]['fileName'];

export type ParsedChecklistAssetKey = {
    slug: string;
    version: string;
    fileName: ChecklistAssetFileName;
};

export type ChecklistAssetBundleReference = {
    assets: Array<{key: string}>;
};

export type VersionedChecklistAssetBundleReference = ChecklistAssetBundleReference & {
    slug: string;
    version: string;
};

function isPathSegment(value: string): boolean {
    return value !== '' && value !== '.' && value !== '..';
}

export function getChecklistAssetDirectory(slug: string, version: string): string {
    if (!isPathSegment(slug) || !isPathSegment(version) || slug.includes('/') || version.includes('/')) {
        throw new Error('Некорректный slug или version для checklist asset bundle.');
    }

    return `checklists/${slug}/${version}`;
}

export function getChecklistAssetKey(
    slug: string,
    version: string,
    fileName: ChecklistAssetFileName,
): string {
    return `${getChecklistAssetDirectory(slug, version)}/${fileName}`;
}

export function parseChecklistAssetKey(key: string): ParsedChecklistAssetKey | null {
    const [root, slug, version, fileName, ...extraSegments] = key.split('/');
    const assetDefinition = checklistAssetDefinitions.find(
        (definition) => definition.fileName === fileName,
    );

    if (
        root !== 'checklists' ||
        !isPathSegment(slug) ||
        !isPathSegment(version) ||
        !fileName ||
        extraSegments.length > 0 ||
        !assetDefinition
    ) {
        return null;
    }

    return {
        slug,
        version,
        fileName: assetDefinition.fileName,
    };
}

export function getChecklistAssetBundleReference(
    downloadImageKey: string,
): VersionedChecklistAssetBundleReference | null {
    const parsedKey = parseChecklistAssetKey(downloadImageKey);

    if (!parsedKey || parsedKey.fileName !== 'checklist.png') {
        return null;
    }

    return {
        slug: parsedKey.slug,
        version: parsedKey.version,
        assets: checklistAssetDefinitions.map(({fileName}) => ({
            key: getChecklistAssetKey(parsedKey.slug, parsedKey.version, fileName),
        })),
    };
}
