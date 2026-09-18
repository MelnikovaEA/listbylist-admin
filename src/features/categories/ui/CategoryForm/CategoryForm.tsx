'use client';

import {zodResolver} from '@hookform/resolvers/zod';
import {useState, type SubmitEvent} from 'react';
import {useForm} from 'react-hook-form';
import {FormField} from '@/src/components/FormField/FormField';
import {FormErrorFeedback, FormSuccessFeedback} from '@/src/components/FormFeedback/FormFeedback';
import {SubmitButton} from '@/src/components/SubmitButton/SubmitButton';
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
    const {register, handleSubmit, reset, formState: {errors, isDirty, isSubmitting}} =
        useForm<CategoryFormInput, unknown, CategoryFormValues>({
            resolver: zodResolver(categoryFormSchema),
            defaultValues: initialValues,
            mode: 'onBlur',
        });

    const getFieldError = (field: keyof CategoryFormInput) => {
        const clientError = errors[field]?.message;
        const serverError = actionResult && !actionResult.success
            ? actionResult.fieldErrors[field]?.[0]
            : undefined;

        return typeof clientError === 'string' ? clientError : serverError;
    };

    const handleFormChange = () => {
        setActionResult(null);
        setUnexpectedError('');
    };

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

        <form className={styles.form} onChange={handleFormChange} onSubmit={submitForm} noValidate>
            <FormField
                label="Slug"
                hint="Slug категории нельзя изменить."
                hintId="category-slug-hint"
            >
                <input value={slug} readOnly aria-describedby="category-slug-hint" />
            </FormField>
            <FormField label="Название *" error={getFieldError('title')}>
                <input {...register('title')} aria-invalid={Boolean(getFieldError('title'))} />
            </FormField>
            <FormField label="Описание *" error={getFieldError('description')}>
                <textarea {...register('description')} aria-invalid={Boolean(getFieldError('description'))} />
            </FormField>
            <SubmitButton disabled={!isDirty || isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? 'Сохраняю…' : 'Сохранить изменения'}
            </SubmitButton>
        </form>
    </main>;
}
