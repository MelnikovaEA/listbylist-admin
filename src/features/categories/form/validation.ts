import {
    categoryFormSchema,
    type CategoryFormField,
    type CategoryFormInput,
    type CategoryFormValues,
} from './schema';
import {
    collectFormValidationErrors,
    getFormString,
    type FormFieldErrors,
    type FormValidationResult,
} from '@/src/lib/forms/validation';

export type CategoryFormFieldErrors = FormFieldErrors<CategoryFormField>;

export type CategoryFormValidationResult = FormValidationResult<
    CategoryFormInput,
    CategoryFormValues,
    CategoryFormField
>;

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

    const {fieldErrors, formErrors} = collectFormValidationErrors(
        result.error.issues,
        values,
    );

    return {success: false, fieldErrors, formErrors, values};
}
