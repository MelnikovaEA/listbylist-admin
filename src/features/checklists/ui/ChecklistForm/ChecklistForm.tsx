'use client';

import {zodResolver} from '@hookform/resolvers/zod';
import {useState, type SubmitEvent} from 'react';
import {useForm} from 'react-hook-form';
import {createChecklistAction} from '@/app/admin/(protected)/checklists/new/actions';
import type {ChecklistFormActionResult} from '../../form/action';
import {
    checklistFormSchema,
    type ChecklistFormInput,
    type ChecklistFormValues,
} from '../../form/schema';
import styles from './ChecklistForm.module.css';

type ChecklistFormProps = {
    action?: (formData: FormData) => Promise<ChecklistFormActionResult>;
    initialValues?: ChecklistFormInput;
};

const emptyValues: ChecklistFormInput = {
    title: '', slug: '', categorySlug: '', categoryTitle: '', categoryDescription: '',
    status: 'DRAFT', subtitle: '', intro: '', description: '', seoTitle: '',
    seoDescription: '', items: '', tags: '',
};

function FieldTooltip({text}: { text: string }) {
    return <span className={styles.tooltipWrap}>
        <span className={styles.tooltipTrigger} tabIndex={0} aria-label={text}>?</span>
        <span className={styles.tooltipBubble} role="tooltip">{text}</span>
    </span>;
}

function FieldError({message}: { message?: string }) {
    return message ? <span className={styles.fieldError}>{message}</span> : null;
}

export function ChecklistForm({action = createChecklistAction, initialValues}: ChecklistFormProps) {
    const isEditing = Boolean(initialValues);
    const [actionResult, setActionResult] = useState<ChecklistFormActionResult | null>(null);
    const [unexpectedError, setUnexpectedError] = useState('');
    const {register, handleSubmit, reset, setError, clearErrors, formState: {errors, isSubmitting}} =
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

    const submitForm = (event: SubmitEvent<HTMLFormElement>) => {
        const form = event.currentTarget;
        const formData = new FormData(form);

        return handleSubmit(async () => {
            clearErrors();
            setActionResult(null);
            setUnexpectedError('');

            try {
                const result = await action(formData);
                setActionResult(result);

                if (!result.success) {
                    for (const [field, messages] of Object.entries(result.fieldErrors)) {
                        if (field === 'image' || field === 'pdf' || !messages?.[0]) continue;
                        setError(field as keyof ChecklistFormInput, {type: 'server', message: messages[0]});
                    }
                    return;
                }

                if (!isEditing) {
                    reset(emptyValues);
                    form.reset();
                }
            } catch {
                setUnexpectedError('Не удалось отправить форму. Попробуй ещё раз.');
            }
        })(event);
    };

    const formErrors = actionResult && !actionResult.success ? actionResult.formErrors : [];
    return <div className={styles.page}>
        <header className={styles.header}>
            <p className={styles.eyebrow}>Локальная админка</p>
            <h1 className={styles.title}>{isEditing ? 'Редактировать чек-лист' : 'Добавить чек-лист'}</h1>
            <p className={styles.description}>Заполни форму и загрузи исходный checklist.png и checklist.pdf. WebP-версии для карточек и просмотра создадутся автоматически.</p>
        </header>

        {actionResult?.success && <div className={styles.success} role="status">
            Чек-лист «{actionResult.title}» {isEditing ? 'обновлён' : 'сохранён'}.
        </div>}
        {actionResult?.success && actionResult.warnings.length > 0 &&
            <div className={styles.warning} role="alert">
                {actionResult.warnings.join(' ')}
            </div>}
        {(unexpectedError || formErrors.length > 0) && <div className={styles.error} role="alert">
            {unexpectedError || formErrors.join(' ')}
        </div>}

        <form className={styles.form} onSubmit={submitForm} noValidate>
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Основное</h2>
                <div className={styles.gridTwo}>
                    <label className={styles.field}><span>Название чек-листа *</span>
                        <input {...register('title')} aria-invalid={Boolean(getFieldError('title'))} placeholder="Чек-лист для летнего пикника" />
                        <FieldError message={getFieldError('title')} />
                    </label>
                    <label className={styles.field}><span className={styles.labelText}>Slug * <FieldTooltip text="Латиница, цифры и дефисы." /></span>
                        <input {...register('slug')} readOnly={isEditing} aria-invalid={Boolean(getFieldError('slug'))} placeholder="letniy-piknik" />
                        <FieldError message={getFieldError('slug')} />
                    </label>
                    <label className={styles.field}><span>Категория: slug *</span>
                        <input {...register('categorySlug')} aria-invalid={Boolean(getFieldError('categorySlug'))} placeholder="seasonal" />
                        <FieldError message={getFieldError('categorySlug')} />
                    </label>
                    <label className={styles.field}><span>Категория: название *</span>
                        <input {...register('categoryTitle')} aria-invalid={Boolean(getFieldError('categoryTitle'))} placeholder="Сезонные" />
                        <FieldError message={getFieldError('categoryTitle')} />
                    </label>
                </div>
                <label className={styles.field}><span>Описание категории</span>
                    <input {...register('categoryDescription')} aria-invalid={Boolean(getFieldError('categoryDescription'))} placeholder="Летние, зимние, праздничные и тематические чек-листы." />
                    <FieldError message={getFieldError('categoryDescription')} />
                </label>
                <label className={styles.field}><span>Статус</span>
                    <select {...register('status')} aria-invalid={Boolean(getFieldError('status'))}>
                        <option value="DRAFT">DRAFT</option><option value="PUBLISHED">PUBLISHED</option><option value="ARCHIVED">ARCHIVED</option>
                    </select>
                    <FieldError message={getFieldError('status')} />
                </label>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Тексты страницы</h2>
                <label className={styles.field}><span>Подзаголовок</span>
                    <input {...register('subtitle')} placeholder="Что взять с собой на природу" />
                </label>
                <label className={styles.field}><span>Intro *</span>
                    <textarea {...register('intro')} aria-invalid={Boolean(getFieldError('intro'))} placeholder="Короткое вступление для карточки и начала страницы." />
                    <FieldError message={getFieldError('intro')} />
                </label>
                <label className={styles.field}><span>Описание *</span>
                    <textarea {...register('description')} aria-invalid={Boolean(getFieldError('description'))} placeholder="Более подробное описание чек-листа." />
                    <FieldError message={getFieldError('description')} />
                </label>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>SEO</h2>
                <label className={styles.field}><span>SEO title *</span>
                    <input {...register('seoTitle')} aria-invalid={Boolean(getFieldError('seoTitle'))} placeholder="Чек-лист для летнего пикника — скачать бесплатно" />
                    <FieldError message={getFieldError('seoTitle')} />
                </label>
                <label className={styles.field}><span>SEO description *</span>
                    <textarea {...register('seoDescription')} aria-invalid={Boolean(getFieldError('seoDescription'))} placeholder="Скачайте бесплатный чек-лист для летнего пикника в PNG или PDF." />
                    <FieldError message={getFieldError('seoDescription')} />
                </label>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Пункты чек-листа</h2>
                <label className={styles.field}><span>Каждый пункт с новой строки *</span>
                    <textarea {...register('items')} aria-invalid={Boolean(getFieldError('items'))} placeholder={`Плед\nВода\nСалфетки\nСредство от насекомых`} />
                    <FieldError message={getFieldError('items')} />
                </label>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Файлы</h2>
                <div className={styles.gridThree}>
                    <label className={styles.fileField}><span className={styles.labelText}>checklist.png <FieldTooltip text="Оригинал из Canva. Из него автоматически создадутся preview.webp и view.webp." /></span>
                        <input name="image" type="file" accept=".png,image/png" aria-invalid={Boolean(getFieldError('image'))} />
                        <FieldError message={getFieldError('image')} />
                    </label>
                    <label className={styles.fileField}><span className={styles.labelText}>checklist.pdf <FieldTooltip text="PDF для печати." /></span>
                        <input name="pdf" type="file" accept=".pdf,application/pdf" aria-invalid={Boolean(getFieldError('pdf'))} />
                        <FieldError message={getFieldError('pdf')} />
                    </label>
                </div>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Теги</h2>
                <label className={styles.field}><span>Через запятую</span>
                    <input {...register('tags')} placeholder="лето, пикник, список вещей, сезонные" />
                </label>
            </section>

            <div className={styles.footer}>
                <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Сохраняю…' : isEditing ? 'Сохранить изменения' : 'Сохранить чек-лист'}
                </button>
                <p className={styles.footerHint}>После сохранения проверь страницу чек-листа и сделай build.</p>
            </div>
        </form>
    </div>;
}
