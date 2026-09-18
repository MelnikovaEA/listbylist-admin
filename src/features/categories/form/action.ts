import 'server-only';

import type {CategoryFormInput} from './schema';
import {
    getCategoryFormInput,
    type CategoryFormFieldErrors,
    validateCategoryForm,
} from './validation';
import {updateCategory} from '../services/updateCategory';

export type CategoryFormActionResult =
    | {success: true; title: string; slug: string}
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
): Promise<CategoryFormActionResult> {
    const validation = validateCategoryForm(formData);

    if (!validation.success) {
        return validation;
    }

    try {
        const category = await saveCategory(id, validation.data);

        return {
            success: true,
            title: category.title,
            slug: category.slug,
        };
    } catch {
        return {
            success: false,
            fieldErrors: {},
            formErrors: ['Не удалось обновить категорию.'],
            values: getCategoryFormInput(formData),
        };
    }
}
