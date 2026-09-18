'use client';

import {zodResolver} from '@hookform/resolvers/zod';
import {useState, type SubmitEvent} from 'react';
import {useForm} from 'react-hook-form';
import {FormErrorFeedback, FormSuccessFeedback} from '@/src/components/FormFeedback/FormFeedback';
import type {CategoryFormActionResult} from '../../form/action';
import {
    categoryFormSchema,
    type CategoryFormInput,
    type CategoryFormValues,
} from '../../form/schema';
import styles from './CategoryForm.module.css';

type CategoryFormProps = {
    action: (formData: FormData) => Promise<CategoryFormActionResult>;
    initialValues: CategoryFormInput;
    slug: string;
};

export function CategoryForm({action, initialValues, slug}: CategoryFormProps) {
    const [actionResult, setActionResult] = useState<CategoryFormActionResult | null>(null);
    const [unexpectedError, setUnexpectedError] = useState('');
    const {register, handleSubmit, reset, setError, formState: {errors, isDirty, isSubmitting}} =
        useForm<CategoryFormInput, unknown, CategoryFormValues>({
            resolver: zodResolver(categoryFormSchema),
            defaultValues: initialValues,
            mode: 'onBlur',
        });

    const submitForm = (event: SubmitEvent<HTMLFormElement>) => {
        if (!isDirty) {
            event.preventDefault();
            return;
        }

        const formData = new FormData(event.currentTarget);

        return handleSubmit(async (values) => {
            setActionResult(null);
            setUnexpectedError('');

            try {
                const result = await action(formData);
                setActionResult(result);

                if (!result.success) {
                    for (const field of ['title', 'description'] as const) {
                        const message = result.fieldErrors[field]?.[0];

                        if (message) {
                            setError(field, {type: 'server', message});
                        }
                    }
                    return;
                }

                reset(values);
            } catch {
                setUnexpectedError('Не удалось отправить форму. Попробуй ещё раз.');
            }
        })(event);
    };

    const formErrors = actionResult && !actionResult.success ? actionResult.formErrors : [];

    return <main className={styles.page}>
        <header className={styles.header}>
            <p>Категории</p>
            <h1>Редактировать категорию</h1>
            <span>Изменения применятся ко всем связанным чек-листам.</span>
        </header>

        {actionResult?.success && <FormSuccessFeedback
            message={<>Категория «{actionResult.title}» обновлена.</>}
            onCloseAction={() => setActionResult(null)}
        />}
        <FormErrorFeedback message={unexpectedError || formErrors.join(' ')} />

        <form className={styles.form} onSubmit={submitForm} noValidate>
            <label className={styles.field}><span>Slug</span>
                <input value={slug} readOnly aria-describedby="category-slug-hint" />
                <small id="category-slug-hint">Slug категории нельзя изменить.</small>
            </label>
            <label className={styles.field}><span>Название *</span>
                <input {...register('title')} aria-invalid={Boolean(errors.title)} />
                {errors.title?.message && <small className={styles.fieldError}>{errors.title.message}</small>}
            </label>
            <label className={styles.field}><span>Описание *</span>
                <textarea {...register('description')} aria-invalid={Boolean(errors.description)} />
                {errors.description?.message && <small className={styles.fieldError}>{errors.description.message}</small>}
            </label>
            <button type="submit" disabled={!isDirty || isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? 'Сохраняю…' : 'Сохранить изменения'}
            </button>
        </form>
    </main>;
}
