import {z} from 'zod';

const requiredString = (message: string) => z.string().trim().min(1, message);

export const categoryFormSchema = z.object({
    title: requiredString('Заполни название категории.'),
    description: requiredString('Заполни описание категории.'),
});

export type CategoryFormInput = z.input<typeof categoryFormSchema>;
export type CategoryFormValues = z.output<typeof categoryFormSchema>;
export type CategoryFormField = keyof CategoryFormInput;
