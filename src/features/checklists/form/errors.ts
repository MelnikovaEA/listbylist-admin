import type {ChecklistFormField} from './schema';

export class ChecklistFormFieldError extends Error {
    constructor(
        public readonly field: ChecklistFormField,
        message: string,
        options?: ErrorOptions,
    ) {
        super(message, options);
        this.name = 'ChecklistFormFieldError';
    }
}
