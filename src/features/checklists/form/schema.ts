import {z} from 'zod';
import {normalizeSlug, validateLatinSlug} from '../model/slug';

const requiredString = (message: string) => z.string().trim().min(1, message);

const latinSlug = (message: string) => z
    .string()
    .transform(normalizeSlug)
    .refine(validateLatinSlug, message);

export const checklistFormSchema = z
    .object({
        title: requiredString('Заполни название чек-листа.'),
        slug: latinSlug('Slug чек-листа должен быть латиницей: letniy-piknik.'),
        categorySlug: latinSlug('Slug категории должен быть латиницей: seasonal, home, travel.'),
        categoryTitle: requiredString('Заполни название категории.'),
        categoryDescription: z.string().trim(),
        subtitle: z.string().trim(),
        intro: requiredString('Заполни intro.'),
        description: requiredString('Заполни описание.'),
        seoTitle: requiredString('Заполни SEO title.'),
        seoDescription: requiredString('Заполни SEO description.'),
        status: z.string().pipe(
            z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'], {
                error: 'Выбери допустимый статус чек-листа.',
            }),
        ),
        items: z.string()
            .transform((value) => value
                .split('\n')
                .map((item) => item.trim())
                .filter(Boolean))
            .refine((items) => items.length > 0, 'Добавь хотя бы один пункт чек-листа.'),
        tags: z.string()
            .transform((value) => value
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)),
    })
    .transform((values) => ({
        ...values,
        categoryDescription: values.categoryDescription ||
            `Чек-листы из категории «${values.categoryTitle}».`,
    }));

export type ChecklistFormInput = z.input<typeof checklistFormSchema>;
export type ChecklistFormValues = z.output<typeof checklistFormSchema>;
export type ChecklistSchemaField = keyof ChecklistFormInput;
export type ChecklistFormField = ChecklistSchemaField | 'image' | 'pdf';
