import 'server-only';

import type {CategoryFormInput} from './schema';
import {
    getCategoryFormInput,
    type CategoryFormFieldErrors,
    validateCategoryForm,
} from './validation';
import {
    updateCategory,
    type CategoryIconIntent,
} from '../services/updateCategory';
import {isUploadedFile} from '@/src/lib/forms/file';

export type {CategoryIconIntent} from '../services/updateCategory';

export type CategoryIconIntentResult =
    | {success: true; intent: CategoryIconIntent}
    | {success: false; error: string};

const ICON_CHANGE_CONFLICT_ERROR =
    'Нельзя одновременно загрузить новую и удалить текущую иконку.';

export function getCategoryIconIntent(formData: FormData): CategoryIconIntentResult {
    const icon = formData.get('icon');
    const hasReplacement = isUploadedFile(icon);
    const hasRemoval = formData.get('removeIcon') === 'true';

    if (hasReplacement && hasRemoval) {
        return {success: false, error: ICON_CHANGE_CONFLICT_ERROR};
    }

    if (hasReplacement) {
        return {success: true, intent: {type: 'replace', file: icon}};
    }

    if (hasRemoval) {
        return {success: true, intent: {type: 'remove'}};
    }

    return {success: true, intent: {type: 'unchanged'}};
}

export type CategoryFormActionResult =
    | {success: true; title: string; slug: string; warnings: string[]}
    | {
        success: false;
        fieldErrors: CategoryFormFieldErrors;
        formErrors: string[];
        values: CategoryFormInput;
    };

export async function updateCategoryFromForm(
    id: string,
    formData: FormData,
    saveCategory: typeof updateCategory = updateCategory,
    logError: (message: string, error: unknown) => void = console.error,
): Promise<CategoryFormActionResult> {
    const validation = validateCategoryForm(formData);

    if (!validation.success) {
        return validation;
    }

    const iconIntent = getCategoryIconIntent(formData);

    if (!iconIntent.success) {
        return {
            success: false,
            fieldErrors: {},
            formErrors: [iconIntent.error],
            values: getCategoryFormInput(formData),
        };
    }

    try {
        const category = await saveCategory(id, validation.data, iconIntent.intent);

        return {
            success: true,
            title: category.title,
            slug: category.slug,
            warnings: category.warnings,
        };
    } catch (error) {
        logError(`Не удалось обновить категорию ${id}.`, error);

        return {
            success: false,
            fieldErrors: {},
            formErrors: ['Не удалось обновить категорию.'],
            values: getCategoryFormInput(formData),
        };
    }
}
