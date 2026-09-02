import 'server-only';

import type {ChecklistFormInput} from './schema';
import {ChecklistFormFieldError} from './errors';
import {
    type ChecklistFormFieldErrors,
    getChecklistFormInput,
    validateChecklistForm,
} from './validation';
import {saveChecklist} from '../services/saveChecklist';

export type ChecklistFormActionResult =
    | {
        success: true;
        title: string;
        slug: string;
    }
    | {
        success: false;
        fieldErrors: ChecklistFormFieldErrors;
        formErrors: string[];
        values: ChecklistFormInput;
    };

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Неизвестная ошибка.';
}

export async function saveChecklistFromForm(
    formData: FormData,
    checklistId?: string,
): Promise<ChecklistFormActionResult> {
    const validation = validateChecklistForm(formData);

    if (!validation.success) {
        return validation;
    }

    try {
        const result = await saveChecklist(validation.data, formData, checklistId);

        return {
            success: true,
            title: result.title,
            slug: result.slug,
        };
    } catch (error) {
        if (error instanceof ChecklistFormFieldError) {
            return {
                success: false,
                fieldErrors: {
                    [error.field]: [error.message],
                },
                formErrors: [],
                values: getChecklistFormInput(formData),
            };
        }

        return {
            success: false,
            fieldErrors: {},
            formErrors: [getErrorMessage(error)],
            values: getChecklistFormInput(formData),
        };
    }
}
