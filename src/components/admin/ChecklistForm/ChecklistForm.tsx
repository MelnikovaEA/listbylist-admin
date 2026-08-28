import {createChecklistAction} from '@/app/admin/(protected)/checklists/new/actions';
import styles from './ChecklistForm.module.css';

type ChecklistFormProps = {
    created?: string;
    updated?: string;
    error?: string;
    action?: (formData: FormData) => void | Promise<void>;
    initialValues?: {
        title: string;
        slug: string;
        categorySlug: string;
        categoryTitle: string;
        categoryDescription: string;
        status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
        subtitle: string;
        intro: string;
        description: string;
        seoTitle: string;
        seoDescription: string;
        items: string;
        tags: string;
    };
};

function FieldTooltip({text}: { text: string }) {
    return (
        <span className={styles.tooltipWrap}>
            <span className={styles.tooltipTrigger} tabIndex={0} aria-label={text}>
                ?
            </span>
            <span className={styles.tooltipBubble} role="tooltip">
                {text}
            </span>
        </span>
    );
}

export function ChecklistForm({created, updated, error, action = createChecklistAction, initialValues}: ChecklistFormProps) {
    const isEditing = Boolean(initialValues);

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <p className={styles.eyebrow}>Локальная админка</p>
                <h1 className={styles.title}>{isEditing ? 'Редактировать чек-лист' : 'Добавить чек-лист'}</h1>
                <p className={styles.description}>
                    Заполни форму и загрузи исходный checklist.png и checklist.pdf.
                    WebP-версии для карточек и просмотра создадутся автоматически.
                </p>
            </header>

            {created && (
                <div className={styles.success}>
                    Чек-лист «{created}» сохранен.
                </div>
            )}

            {updated && (
                <div className={styles.success}>Чек-лист «{updated}» обновлён.</div>
            )}

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            <form
                className={styles.form}
                action={action}
            >
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Основное</h2>

                    <div className={styles.gridTwo}>
                        <label className={styles.field}>
                            <span>Название чек-листа *</span>
                            <input
                                name="title"
                                required
                                defaultValue={initialValues?.title}
                                placeholder="Чек-лист для летнего пикника"
                            />
                        </label>

                        <label className={styles.field}>
                            <span className={styles.labelText}>
                                Slug *
                                <FieldTooltip text="Латиница, цифры и дефисы." />
                            </span>
                            <input
                                name="slug"
                                required
                                readOnly={isEditing}
                                defaultValue={initialValues?.slug}
                                placeholder="letniy-piknik"
                            />
                        </label>

                        <label className={styles.field}>
                            <span>Категория: slug *</span>
                            <input
                                name="categorySlug"
                                required
                                defaultValue={initialValues?.categorySlug}
                                placeholder="seasonal"
                            />
                        </label>

                        <label className={styles.field}>
                            <span>Категория: название *</span>
                            <input
                                name="categoryTitle"
                                required
                                defaultValue={initialValues?.categoryTitle}
                                placeholder="Сезонные"
                            />
                        </label>
                    </div>

                    <label className={styles.field}>
                        <span>Описание категории</span>
                        <input
                            name="categoryDescription"
                            defaultValue={initialValues?.categoryDescription}
                            placeholder="Летние, зимние, праздничные и тематические чек-листы."
                        />
                    </label>

                    <label className={styles.field}>
                        <span>Статус</span>
                        <select name="status" defaultValue={initialValues?.status ?? 'DRAFT'}>
                            <option value="DRAFT">DRAFT</option>
                            <option value="PUBLISHED">PUBLISHED</option>
                            <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                    </label>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Тексты страницы</h2>

                    <label className={styles.field}>
                        <span>Подзаголовок</span>
                        <input
                            name="subtitle"
                            defaultValue={initialValues?.subtitle}
                            placeholder="Что взять с собой на природу"
                        />
                    </label>

                    <label className={styles.field}>
                        <span>Intro *</span>
                        <textarea
                            name="intro"
                            required
                            defaultValue={initialValues?.intro}
                            placeholder="Короткое вступление для карточки и начала страницы."
                        />
                    </label>

                    <label className={styles.field}>
                        <span>Описание *</span>
                        <textarea
                            name="description"
                            required
                            defaultValue={initialValues?.description}
                            placeholder="Более подробное описание чек-листа."
                        />
                    </label>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>SEO</h2>

                    <label className={styles.field}>
                        <span>SEO title *</span>
                        <input
                            name="seoTitle"
                            required
                            defaultValue={initialValues?.seoTitle}
                            placeholder="Чек-лист для летнего пикника — скачать бесплатно"
                        />
                    </label>

                    <label className={styles.field}>
                        <span>SEO description *</span>
                        <textarea
                            name="seoDescription"
                            required
                            defaultValue={initialValues?.seoDescription}
                            placeholder="Скачайте бесплатный чек-лист для летнего пикника в PNG или PDF."
                        />
                    </label>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Пункты чек-листа</h2>

                    <label className={styles.field}>
                        <span>Каждый пункт с новой строки *</span>
                        <textarea
                            name="items"
                            required
                            defaultValue={initialValues?.items}
                            placeholder={`Плед\nВода\nСалфетки\nСредство от насекомых`}
                        />
                    </label>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Файлы</h2>

                    <div className={styles.gridThree}>
                        <label className={styles.fileField}>
                            <span className={styles.labelText}>
                                checklist.png
                                <FieldTooltip text="Оригинал из Canva. Из него автоматически создадутся preview.webp и view.webp." />
                            </span>
                            <input
                                name="image"
                                type="file"
                                accept=".png,image/png"
                            />
                        </label>

                        <label className={styles.fileField}>
                            <span className={styles.labelText}>
                                checklist.pdf
                                <FieldTooltip text="PDF для печати." />
                            </span>
                            <input
                                name="pdf"
                                type="file"
                                accept=".pdf,application/pdf"
                            />
                        </label>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Теги</h2>

                    <label className={styles.field}>
                        <span>Через запятую</span>
                        <input
                            name="tags"
                            defaultValue={initialValues?.tags}
                            placeholder="лето, пикник, список вещей, сезонные"
                        />
                    </label>
                </section>

                <div className={styles.footer}>
                    <button className={styles.submitButton} type="submit">
                        {isEditing ? 'Сохранить изменения' : 'Сохранить чек-лист'}
                    </button>

                    <p className={styles.footerHint}>
                        После сохранения проверь страницу чек-листа и сделай build.
                    </p>
                </div>
            </form>
        </div>
    );
}
