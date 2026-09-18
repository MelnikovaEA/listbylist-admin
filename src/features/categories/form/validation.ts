import {
    categoryFormSchema,
    type CategoryFormField,
    type CategoryFormInput,
    type CategoryFormValues,
} from './schema';

export type CategoryFormFieldErrors = Partial<Record<CategoryFormField, string[]>>;

export type CategoryFormValidationResult =
    | {success: true; data: CategoryFormValues}
    | {
        success: false;
        fieldErrors: CategoryFormFieldErrors;
        formErrors: string[];
        values: CategoryFormInput;
    };

function getFormString(formData: FormData, key: CategoryFormField): string {
    const value = formData.get(key);

    return typeof value === 'string' ? value : '';
}

export function getCategoryFormInput(formData: FormData): CategoryFormInput {
    return {
        title: getFormString(formData, 'title'),
        description: getFormString(formData, 'description'),
    };
}

export function validateCategoryForm(formData: FormData): CategoryFormValidationResult {
    const values = getCategoryFormInput(formData);
    const result = categoryFormSchema.safeParse(values);

    if (result.success) {
        return {success: true, data: result.data};
    }

    const fieldErrors: CategoryFormFieldErrors = {};
    const formErrors: string[] = [];

    for (const issue of result.error.issues) {
        const field = issue.path[0];

        if (field === 'title' || field === 'description') {
            fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message];
        } else {
            formErrors.push(issue.message);
        }
    }

    return {success: false, fieldErrors, formErrors, values};
}
