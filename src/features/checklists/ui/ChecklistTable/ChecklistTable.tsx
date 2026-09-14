import Link from 'next/link';
import type {ChecklistTableItem} from '../../model/checklistTableItem';
import {DeleteChecklistButton} from './DeleteChecklistButton';
import {DragScroll} from './DragScroll';
import styles from './ChecklistTable.module.css';

type ChecklistTableProps = {
    checklists: ChecklistTableItem[];
    publicSiteUrl: string;
    deleteAction: (id: string) => Promise<void>;
};

const statusLabels = {
    DRAFT: 'Черновик',
    PUBLISHED: 'Опубликован',
    ARCHIVED: 'В архиве',
} as const;
const statusClassNames = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
} as const;
const checklistFiles = [
    'preview-400.webp',
    'preview-640.webp',
    'preview-960.webp',
    'view.webp',
    'checklist.png',
    'checklist.pdf',
] as const;
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

function formatDate(value: Date | null): string {
    return value ? dateFormatter.format(value) : '—';
}

export function ChecklistTable({checklists, publicSiteUrl, deleteAction}: ChecklistTableProps) {
    return <main className={styles.page}>
        <div className={styles.headerRow}>
            <header className={styles.header}>
                <p>Контент</p>
                <h1>Чек-листы</h1>
                <span>Всего: {checklists.length}</span>
            </header>
            <Link className={styles.createLink} href="/admin/checklists/new">Создать чек-лист</Link>
        </div>

        {checklists.length === 0 ? <div className={styles.empty}>Пока нет ни одного чек-листа.</div> :
            <DragScroll>
                <table className={styles.table}>
                    <thead><tr>
                        <th>ID</th><th>Slug</th><th>Название</th><th>Превью</th><th>Подзаголовок</th>
                        <th>Intro</th><th>Описание</th><th>SEO title</th><th>SEO description</th>
                        <th>Статус</th><th>Category ID</th><th>Категория</th><th>Теги</th>
                        <th>Пункты</th><th>Файлы</th><th>Опубликован</th><th>Создан</th><th>Обновлён</th>
                        <th className={styles.actionsHeading}>Действия</th>
                    </tr></thead>
                    <tbody>{checklists.map((checklist) => <tr key={checklist.id}>
                        <td className={styles.idCell}>{checklist.id}</td>
                        <td className={styles.slugCell}>{checklist.slug}</td>
                        <td className={styles.titleCell}><strong>{checklist.title}</strong></td>
                        <td>{checklist.previewUrl
                            // The asset is already an optimized WebP and is intentionally loaded directly from S3.
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img
                                className={styles.preview}
                                src={checklist.previewUrl}
                                alt={'Превью чек-листа «' + checklist.title + '»'}
                                width={72}
                                height={100}
                                loading="lazy"
                            />
                            : 'Файл недоступен'}</td>
                        <td className={styles.textCell}>{checklist.subtitle || '—'}</td>
                        <td className={styles.textCell}>{checklist.intro}</td>
                        <td className={styles.textCell}>{checklist.description}</td>
                        <td className={styles.textCell}>{checklist.seoTitle}</td>
                        <td className={styles.textCell}>{checklist.seoDescription}</td>
                        <td><span className={`${styles.status} ${styles[statusClassNames[checklist.status]]}`}>
                            {statusLabels[checklist.status]}
                        </span></td>
                        <td className={styles.idCell}>{checklist.categoryId}</td>
                        <td>{checklist.categoryTitle}</td>
                        <td className={styles.listCell}>{checklist.tags.length > 0
                            ? <div className={styles.tags}>{checklist.tags.map((tag) =>
                                <span key={tag.id}>{tag.title}</span>)}</div>
                            : '—'}</td>
                        <td className={styles.listCell}>{checklist.items.length > 0
                            ? <ol className={styles.items}>{checklist.items.map((item) =>
                                <li key={item.id}>{item.text}</li>)}</ol>
                            : '—'}</td>
                        <td className={styles.listCell}><div className={styles.assetLinks}>
                            {checklistFiles.map((fileName) => <a
                                key={fileName}
                                href={new URL(`/checklists/${checklist.slug}/${fileName}`, publicSiteUrl).toString()}
                                target="_blank"
                                rel="noreferrer"
                            >{fileName}</a>)}
                        </div></td>
                        <td className={styles.dateCell}>{formatDate(checklist.publishedAt)}</td>
                        <td className={styles.dateCell}>{formatDate(checklist.createdAt)}</td>
                        <td className={styles.dateCell}>{formatDate(checklist.updatedAt)}</td>
                        <td className={styles.actionsCell}><div className={styles.rowActions}>
                            <Link
                                className={styles.editLink}
                                href={`/admin/checklists/${checklist.id}/edit`}
                                aria-label={`Редактировать чек-лист «${checklist.title}»`}
                                title="Редактировать"
                            ><svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M4 20h4.2L19 9.2 14.8 5 4 15.8V20Zm2-3.4 8.8-8.8 1.4 1.4L7.4 18H6v-1.4ZM17.6 2.2a2 2 0 0 1 2.8 0l1.4 1.4a2 2 0 0 1 0 2.8L20.4 7.8 16.2 3.6l1.4-1.4Z" />
                            </svg></Link>
                            <form action={deleteAction.bind(null, checklist.id)}>
                                <DeleteChecklistButton title={checklist.title} />
                            </form>
                        </div></td>
                    </tr>)}</tbody>
                </table>
            </DragScroll>}
    </main>;
}
