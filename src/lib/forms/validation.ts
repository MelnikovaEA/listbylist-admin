export type FormFieldErrors<TField extends string> = Partial<Record<TField, string[]>>;

export type FormValidationResult<
    TInput,
    TValues,
    TField extends string,
> =
    | {success: true; data: TValues}
    | {
        success: false;
        fieldErrors: FormFieldErrors<TField>;
        formErrors: string[];
        values: TInput;
    };

type FormValidationIssue = {
    message: string;
    path: ReadonlyArray<PropertyKey>;
};

type StringField<TValues> = Extract<keyof TValues, string>;

export function getFormString(formData: FormData, key: string): string {
    const value = formData.get(key);

    return typeof value === 'string' ? value : '';
}

function isFormField<TValues extends object>(
    field: PropertyKey,
    values: TValues,
): field is StringField<TValues> {
    return typeof field === 'string' && field in values;
}

function appendUniqueMessage<TField extends string>(
    errors: FormFieldErrors<TField>,
    field: TField,
    message: string,
): void {
    const messages = errors[field] ?? [];

    if (!messages.includes(message)) {
        errors[field] = [...messages, message];
    }
}

export function collectFormValidationErrors<TValues extends object>(
    issues: ReadonlyArray<FormValidationIssue>,
    values: TValues,
): {
    fieldErrors: FormFieldErrors<StringField<TValues>>;
    formErrors: string[];
} {
    const fieldErrors: FormFieldErrors<StringField<TValues>> = {};
    const formErrors: string[] = [];

    for (const issue of issues) {
        const field = issue.path[0];

        if (isFormField(field, values)) {
            appendUniqueMessage(fieldErrors, field, issue.message);
        } else if (!formErrors.includes(issue.message)) {
            formErrors.push(issue.message);
        }
    }

    return {fieldErrors, formErrors};
}
