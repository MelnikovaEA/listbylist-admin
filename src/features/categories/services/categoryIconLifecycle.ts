import 'server-only';

import {
    deleteCategoryIcon,
    prepareCategoryIcon,
    uploadCategoryIcon,
    type PreparedCategoryIcon,
} from '../files/icon';
import {
    validateCategoryIcon,
    type ValidatedCategoryIcon,
} from '../files/validation';
import {createAssetVersion} from '@/src/lib/storage/objectVersion';

type SavedCategory = {
    id: string;
    slug: string;
    title: string;
};

type CleanupCategoryIconDependencies = {
    deleteIcon: (key: string, expectedSlug: string) => Promise<void>;
    logCleanupError: (message: string, error: unknown) => void;
};

type ReplaceCategoryIconDependencies = CleanupCategoryIconDependencies & {
    validateIcon: (file: File) => Promise<ValidatedCategoryIcon>;
    createVersion: () => string;
    prepareIcon: (
        slug: string,
        source: ValidatedCategoryIcon,
        version: string,
    ) => Promise<PreparedCategoryIcon>;
    uploadIcon: (icon: PreparedCategoryIcon) => Promise<void>;
};

type ReplaceCategoryIconInput = {
    file: File;
    slug: string;
    previousIconKey: string | null;
    updateRecord: (newIconKey: string) => Promise<SavedCategory>;
};

export const CATEGORY_ICON_CLEANUP_WARNING =
    'Категория сохранена, но старую иконку не удалось удалить из хранилища.';

const defaultCleanupDependencies: CleanupCategoryIconDependencies = {
    deleteIcon: deleteCategoryIcon,
    logCleanupError: console.error,
};

const defaultReplaceDependencies: ReplaceCategoryIconDependencies = {
    ...defaultCleanupDependencies,
    validateIcon: validateCategoryIcon,
    createVersion: createAssetVersion,
    prepareIcon: prepareCategoryIcon,
    uploadIcon: uploadCategoryIcon,
};

export async function cleanupCategoryIcon(
    key: string | null,
    slug: string,
    dependencies: CleanupCategoryIconDependencies = defaultCleanupDependencies,
): Promise<string[]> {
    if (!key) {
        return [];
    }

    try {
        await dependencies.deleteIcon(key, slug);
        return [];
    } catch (error) {
        dependencies.logCleanupError(
            `Не удалось удалить предыдущую иконку категории ${slug}.`,
            error,
        );
        return [CATEGORY_ICON_CLEANUP_WARNING];
    }
}

export async function replaceCategoryIcon(
    input: ReplaceCategoryIconInput,
    dependencies: ReplaceCategoryIconDependencies = defaultReplaceDependencies,
) {
    const validatedIcon = await dependencies.validateIcon(input.file);
    const version = dependencies.createVersion();
    const newIcon = await dependencies.prepareIcon(
        input.slug,
        validatedIcon,
        version,
    );
    await dependencies.uploadIcon(newIcon);

    let category: SavedCategory;

    try {
        category = await input.updateRecord(newIcon.key);
    } catch (databaseError) {
        try {
            await dependencies.deleteIcon(newIcon.key, input.slug);
        } catch (rollbackError) {
            throw new AggregateError(
                [databaseError, rollbackError],
                'Не удалось обновить категорию и удалить новую иконку после ошибки.',
            );
        }

        throw databaseError;
    }

    const warnings = await cleanupCategoryIcon(
        input.previousIconKey,
        input.slug,
        dependencies,
    );

    return {...category, warnings};
}
