import {z} from 'zod';
import {requiredString} from '@/src/lib/forms/schema';

export const categoryFormSchema = z.object({
    title: requiredString('Заполни название категории.'),
    description: requiredString('Заполни описание категории.'),
});

export type CategoryFormInput = z.input<typeof categoryFormSchema>;
export type CategoryFormValues = z.output<typeof categoryFormSchema>;
export type CategoryFormField = keyof CategoryFormInput;
