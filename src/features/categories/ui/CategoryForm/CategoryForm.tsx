'use client';

import {PageHeader} from '@/src/components/PageHeader/PageHeader';
import {FormActions, FormLayout} from '@/src/components/FormLayout/FormLayout';
import {zodResolver} from '@hookform/resolvers/zod';
import {useEffect, useRef, useState, type ChangeEvent, type SubmitEvent} from 'react';
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
    iconUrl: string | null;
    initialValues: CategoryFormInput;
    slug: string;
};

export function CategoryForm({action, iconUrl, initialValues, slug}: CategoryFormProps) {
    const [actionResult, setActionResult] = useState<CategoryFormActionResult | null>(null);
    const [unexpectedError, setUnexpectedError] = useState('');
    const [selectedIconUrl, setSelectedIconUrl] = useState<string | null>(null);
    const [hasRemoveIcon, setHasRemoveIcon] = useState(false);
    const {register, handleSubmit, reset, formState: {errors, isDirty, isSubmitting}} =
        useForm<CategoryFormInput, unknown, CategoryFormValues>({
            resolver: zodResolver(categoryFormSchema),
            defaultValues: initialValues,
            mode: 'onBlur',
        });
    const hasSelectedIcon = Boolean(selectedIconUrl);
    const hasChanges = isDirty || hasSelectedIcon || hasRemoveIcon;

    const iconInputRef = useRef<HTMLInputElement>(null);

    useEffect(() =>{
        return () => {
            if (selectedIconUrl) {
                URL.revokeObjectURL(selectedIconUrl);
            }
        }
    }, [selectedIconUrl]);

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

    const handleIconChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];

        setSelectedIconUrl(file ? URL.createObjectURL(file) : null);
    };

    const clearSelectedIcon = () => {
        if (iconInputRef.current) {
            iconInputRef.current.value = '';
        }

        setSelectedIconUrl(null);
    };

    const submitForm = (event: SubmitEvent<HTMLFormElement>) => {
        if (!hasChanges) {
            event.preventDefault();
            return;
        }

        const form = event.currentTarget;
        const formData = new FormData(form);

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
                setSelectedIconUrl(null);
                setHasRemoveIcon(false);

                if (iconInputRef.current) {
                    iconInputRef.current.value = '';
                }
            } catch {
                setUnexpectedError('Не удалось отправить форму. Попробуй ещё раз.');
            }
        })(event);
    };

    const formErrors = actionResult && !actionResult.success ? actionResult.formErrors : [];

    return <>
        <PageHeader
            eyebrow="Категории"
            title="Редактировать категорию"
            description="Изменения применятся ко всем связанным чек-листам."
        />

        {actionResult?.success && <FormSuccessFeedback
            message={<>Категория «{actionResult.title}» обновлена.</>}
            onCloseAction={() => setActionResult(null)}
            warnings={actionResult.warnings}
        />}
        <FormErrorFeedback message={unexpectedError || formErrors.join(' ')}/>

        <FormLayout onChange={handleFormChange} onSubmit={submitForm} noValidate>
            <FormField
                label="Slug"
                hint="Slug категории нельзя изменить."
                hintId="category-slug-hint"
            >
                <input value={slug} readOnly aria-describedby="category-slug-hint"/>
            </FormField>
            <FormField label="Название *" error={getFieldError('title')}>
                <input {...register('title')} aria-invalid={Boolean(getFieldError('title'))}/>
            </FormField>
            <FormField label="Описание *" error={getFieldError('description')}>
                <textarea {...register('description')} aria-invalid={Boolean(getFieldError('description'))}/>
            </FormField>
            <section className={styles.iconField} aria-labelledby="category-icon-label">
                <span className={styles.iconLabel} id="category-icon-label">Иконка</span>
                {iconUrl && <div className={styles.previewBlock}>
                    <span>Текущая иконка</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        className={styles.iconPreview}
                        src={iconUrl}
                        alt="Текущая иконка категории"
                        width={128}
                        height={128}
                    />
                    {iconUrl && <label className={styles.removeIcon}>
                        <input
                            name="removeIcon"
                            type="checkbox"
                            value="true"
                            checked={hasRemoveIcon}
                            disabled={hasSelectedIcon}
                            onChange={(e) => setHasRemoveIcon(e.target.checked)}
                        />
                        Удалить иконку
                    </label>}
                </div>}
                {selectedIconUrl && <div className={styles.previewBlock}>
                        <span>Новая иконка</span>
                        {/* Blob URLs from local file inputs cannot be optimized by next/image. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            className={styles.iconPreview}
                            src={selectedIconUrl}
                            alt="Предпросмотр новой иконки категории"
                            width={128}
                            height={128}
                        />
                        <button
                            className={styles.clearIcon}
                            type="button"
                            onClick={clearSelectedIcon}
                        >Отменить выбор</button>
                    </div>}
                <label className={styles.fileField}>
                    <span className={styles.fileLabel}>icon.png</span>
                    <input
                        ref={iconInputRef}
                        name="icon"
                        type="file"
                        accept=".png,image/png"
                        disabled={hasRemoveIcon}
                        onChange={handleIconChange}
                    />
                </label>
            </section>
            <FormActions>
                <SubmitButton disabled={!hasChanges || isSubmitting} aria-busy={isSubmitting}>
                    {isSubmitting ? 'Сохраняю…' : 'Сохранить изменения'}
                </SubmitButton>
            </FormActions>
        </FormLayout>
    </>;
}
