import {
    checklistFormSchema,
    type ChecklistFormField,
    type ChecklistFormInput,
    type ChecklistFormValues,
} from './schema';
import {
    collectFormValidationErrors,
    getFormString,
    type FormFieldErrors,
    type FormValidationResult,
} from '@/src/lib/forms/validation';

export type ChecklistFormFieldErrors = FormFieldErrors<ChecklistFormField>;

export type ChecklistFormValidationResult = FormValidationResult<
    ChecklistFormInput,
    ChecklistFormValues,
    ChecklistFormField
>;

export function getChecklistFormInput(formData: FormData): ChecklistFormInput {
    return {
        title: getFormString(formData, 'title'),
        slug: getFormString(formData, 'slug'),
        categorySlug: getFormString(formData, 'categorySlug'),
        categoryTitle: getFormString(formData, 'categoryTitle'),
        categoryDescription: getFormString(formData, 'categoryDescription'),
        subtitle: getFormString(formData, 'subtitle'),
        intro: getFormString(formData, 'intro'),
        description: getFormString(formData, 'description'),
        seoTitle: getFormString(formData, 'seoTitle'),
        seoDescription: getFormString(formData, 'seoDescription'),
        status: getFormString(formData, 'status'),
        items: getFormString(formData, 'items'),
        tags: getFormString(formData, 'tags'),
    };
}

export function validateChecklistForm(formData: FormData): ChecklistFormValidationResult {
    const values = getChecklistFormInput(formData);
    const result = checklistFormSchema.safeParse(values);

    if (result.success) {
        return {
            success: true,
            data: result.data,
        };
    }

    const {fieldErrors, formErrors} = collectFormValidationErrors(
        result.error.issues,
        values,
    );

    return {
        success: false,
        fieldErrors,
        formErrors,
        values,
    };
}
