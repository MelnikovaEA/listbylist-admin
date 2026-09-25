'use client';

import {zodResolver} from '@hookform/resolvers/zod';
import {useState, type SubmitEvent} from 'react';
import {useForm} from 'react-hook-form';
import {createChecklistAction} from '@/app/admin/(protected)/checklists/new/actions';
import {FieldTooltip} from '@/src/components/FieldFeedback/FieldFeedback';
import {FormField} from '@/src/components/FormField/FormField';
import {FormErrorFeedback, FormSuccessFeedback} from '@/src/components/FormFeedback/FormFeedback';
import {SubmitButton} from '@/src/components/SubmitButton/SubmitButton';
import type {CategoryOption} from '@/src/features/categories/model/categoryOption';
import type {ChecklistFormActionResult} from '../../form/action';
import {
    checklistFormSchema,
    type ChecklistFormInput,
    type ChecklistFormValues,
} from '../../form/schema';
import {FileFields} from './FileFields/FileFields';
import {CategoryFields} from './CategoryFields/CategoryFields';
import styles from './ChecklistForm.module.css';

type ChecklistFormProps = {
    action?: (formData: FormData) => Promise<ChecklistFormActionResult>;
    categories: CategoryOption[];
    initialValues?: ChecklistFormInput;
    initialPreviewUrl?: string | null;
};

const emptyValues: ChecklistFormInput = {
    title: '', slug: '', categorySlug: '', categoryTitle: '', categoryDescription: '',
    status: 'DRAFT', subtitle: '', intro: '', description: '', seoTitle: '',
    seoDescription: '', items: '', tags: '',
};

export function ChecklistForm({
    action = createChecklistAction,
    categories,
    initialValues,
    initialPreviewUrl = null,
}: ChecklistFormProps) {
    const isEditing = Boolean(initialValues);
    const [fileFieldsVersion, setFileFieldsVersion] = useState(0);
    const [hasSelectedFiles, setHasSelectedFiles] = useState(false);
    const [actionResult, setActionResult] = useState<ChecklistFormActionResult | null>(null);
    const [unexpectedError, setUnexpectedError] = useState('');
    const {register, handleSubmit, reset, clearErrors, getValues, setValue, control, formState: {errors, isDirty, isSubmitting}} =
        useForm<ChecklistFormInput, unknown, ChecklistFormValues>({
            resolver: zodResolver(checklistFormSchema),
            defaultValues: initialValues ?? emptyValues,
            mode: 'onBlur',
        });

    const getFieldError = (field: keyof ChecklistFormInput | 'image' | 'pdf') => {
        const clientError = field === 'image' || field === 'pdf' ? undefined : errors[field]?.message;
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
        if (isEditing && !isDirty && !hasSelectedFiles) {
            event.preventDefault();
            return;
        }

        const form = event.currentTarget;
        const formData = new FormData(form);

        return handleSubmit(async () => {
            setActionResult(null);
            setUnexpectedError('');

            try {
                const result = await action(formData);
                setActionResult(result);

                if (!result.success) {
                    return;
                }

                setHasSelectedFiles(false);
                setFileFieldsVersion(version => version + 1);

                if (isEditing) {
                    reset(getValues());
                } else {
                    reset(emptyValues);
                    form.reset();
                }
            } catch {
                setUnexpectedError('Не удалось отправить форму. Попробуй ещё раз.');
            }
        })(event);
    };

    return <>
        <header className={styles.header}>
            <p className={styles.eyebrow}>Локальная админка</p>
            <h1 className={styles.title}>{isEditing ? 'Редактировать чек-лист' : 'Добавить чек-лист'}</h1>
            <p className={styles.description}>Заполни форму и загрузи исходный checklist.png и checklist.pdf. WebP-версии для карточек и просмотра создадутся автоматически.</p>
        </header>

        {actionResult?.success && <FormSuccessFeedback
            message={<>Чек-лист «{actionResult.title}» {isEditing ? 'обновлён' : 'сохранён'}.</>}
            onCloseAction={() => setActionResult(null)}
            warnings={actionResult.warnings}
        />}
        <FormErrorFeedback message={unexpectedError || (
            actionResult && !actionResult.success ? actionResult.formErrors.join(' ') : ''
        )} />

        <form className={styles.form} onChange={handleFormChange} onSubmit={submitForm} noValidate>
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Основное</h2>
                <div className={styles.gridTwo}>
                    <FormField label="Название чек-листа *" error={getFieldError('title')}>
                        <input {...register('title')} aria-invalid={Boolean(getFieldError('title'))} placeholder="Чек-лист для летнего пикника" />
                    </FormField>
                    <FormField
                        label={<>Slug * <FieldTooltip text="Латиница, цифры и дефисы." /></>}
                        error={getFieldError('slug')}
                    >
                        <input {...register('slug')} readOnly={isEditing} aria-invalid={Boolean(getFieldError('slug'))} placeholder="letniy-piknik" />
                    </FormField>
                </div>
                <CategoryFields
                    categories={categories}
                    errors={{
                        slug: getFieldError('categorySlug'),
                        title: getFieldError('categoryTitle'),
                        description: getFieldError('categoryDescription'),
                    }}
                    form={{clearErrors, control, register, setValue}}
                />
                <FormField label="Статус" error={getFieldError('status')}>
                    <select {...register('status')} aria-invalid={Boolean(getFieldError('status'))}>
                        <option value="DRAFT">DRAFT</option><option value="PUBLISHED">PUBLISHED</option><option value="ARCHIVED">ARCHIVED</option>
                    </select>
                </FormField>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Тексты страницы</h2>
                <FormField label="Подзаголовок">
                    <input {...register('subtitle')} placeholder="Что взять с собой на природу" />
                </FormField>
                <FormField label="Intro *" error={getFieldError('intro')}>
                    <textarea {...register('intro')} aria-invalid={Boolean(getFieldError('intro'))} placeholder="Короткое вступление для карточки и начала страницы." />
                </FormField>
                <FormField label="Описание *" error={getFieldError('description')}>
                    <textarea {...register('description')} aria-invalid={Boolean(getFieldError('description'))} placeholder="Более подробное описание чек-листа." />
                </FormField>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>SEO</h2>
                <FormField label="SEO title *" error={getFieldError('seoTitle')}>
                    <input {...register('seoTitle')} aria-invalid={Boolean(getFieldError('seoTitle'))} placeholder="Чек-лист для летнего пикника — скачать бесплатно" />
                </FormField>
                <FormField label="SEO description *" error={getFieldError('seoDescription')}>
                    <textarea {...register('seoDescription')} aria-invalid={Boolean(getFieldError('seoDescription'))} placeholder="Скачайте бесплатный чек-лист для летнего пикника в PNG или PDF." />
                </FormField>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Пункты чек-листа</h2>
                <FormField label="Каждый пункт с новой строки *" error={getFieldError('items')}>
                    <textarea {...register('items')} aria-invalid={Boolean(getFieldError('items'))} placeholder={`Плед\nВода\nСалфетки\nСредство от насекомых`} />
                </FormField>
            </section>

            <FileFields
                key={fileFieldsVersion}
                imageError={getFieldError('image')}
                initialPreviewUrl={initialPreviewUrl}
                isEditing={isEditing}
                onSelectionChange={setHasSelectedFiles}
                pdfError={getFieldError('pdf')}
            />

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Теги</h2>
                <FormField label="Через запятую">
                    <input {...register('tags')} placeholder="лето, пикник, список вещей, сезонные" />
                </FormField>
            </section>

            <div className={styles.footer}>
                <SubmitButton
                    disabled={isSubmitting || (isEditing && !isDirty && !hasSelectedFiles)}
                    aria-busy={isSubmitting}
                >
                    {isSubmitting ? 'Сохраняю…' : isEditing ? 'Сохранить изменения' : 'Сохранить чек-лист'}
                </SubmitButton>
                <p className={styles.footerHint}>После сохранения проверь страницу чек-листа и сделай build.</p>
            </div>
        </form>
    </>;
}
