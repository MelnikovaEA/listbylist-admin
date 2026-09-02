import {
    checklistFormSchema,
    type ChecklistFormField,
    type ChecklistFormInput,
    type ChecklistFormValues,
    type ChecklistSchemaField,
} from './schema';

export type ChecklistFormFieldErrors = Partial<Record<ChecklistFormField, string[]>>;

export type ChecklistFormValidationResult =
    | {
        success: true;
        data: ChecklistFormValues;
    }
    | {
        success: false;
        fieldErrors: ChecklistFormFieldErrors;
        formErrors: string[];
        values: ChecklistFormInput;
    };

function getFormString(formData: FormData, key: string): string {
    const value = formData.get(key);

    return typeof value === 'string' ? value : '';
}

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

function appendError(
    errors: ChecklistFormFieldErrors,
    field: ChecklistFormField,
    message: string,
): void {
    const messages = errors[field] ?? [];

    if (!messages.includes(message)) {
        errors[field] = [...messages, message];
    }
}

function isChecklistSchemaField(
    field: PropertyKey,
    values: ChecklistFormInput,
): field is ChecklistSchemaField {
    return typeof field === 'string' && field in values;
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

    const fieldErrors: ChecklistFormFieldErrors = {};
    const formErrors: string[] = [];

    for (const issue of result.error.issues) {
        const field = issue.path[0];

        if (isChecklistSchemaField(field, values)) {
            appendError(fieldErrors, field, issue.message);
        } else if (!formErrors.includes(issue.message)) {
            formErrors.push(issue.message);
        }
    }

    return {
        success: false,
        fieldErrors,
        formErrors,
        values,
    };
}
