import Link from "next/link";
import { deleteChecklistAction } from './actions';
import { prisma } from '@/src/lib/prisma';
import { DeleteChecklistButton } from '@/src/components/admin/ChecklistTable/DeleteChecklistButton';
import { DragScroll } from '@/src/components/admin/ChecklistTable/DragScroll';
import styles from '@/src/components/admin/ChecklistTable/ChecklistTable.module.css';

const statusLabels = { DRAFT: 'Черновик', PUBLISHED: 'Опубликован', ARCHIVED: 'В архиве' } as const;
const checklistFiles = [
  'preview-400.webp',
  'preview-640.webp',
  'preview-960.webp',
  'view.webp',
  'checklist.png',
  'checklist.pdf',
] as const;
const dateFormatter = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });

function formatDate(value: Date | null) {
  return value ? dateFormatter.format(value) : '—';
}

export default async function AdminChecklistsPage() {
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const checklists = await prisma.checklist.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      category: { select: { title: true } },
      items: { orderBy: { sortOrder: 'asc' } },
      tags: { include: { tag: true } },
    },
  });

  return (
    <main className={styles.page}>
      <div className={styles.headerRow}>
        <header className={styles.header}>
          <p>Контент</p>
          <h1>Чек-листы</h1>
          <span>Всего: {checklists.length}</span>
        </header>
        <Link className={styles.createLink} href="/admin/checklists/new">Создать чек-лист</Link>
      </div>

      {checklists.length === 0 ? (
        <div className={styles.empty}>Пока нет ни одного чек-листа.</div>
      ) : (
        <DragScroll>
          <table className={styles.table}>
            <thead><tr>
              <th>ID</th><th>Slug</th><th>Название</th><th>Подзаголовок</th>
              <th>Intro</th><th>Описание</th><th>SEO title</th><th>SEO description</th>
              <th>Статус</th><th>Category ID</th><th>Категория</th><th>Теги</th>
              <th>Пункты</th><th>Файлы</th>
              <th>Опубликован</th><th>Создан</th><th>Обновлён</th>
              <th className={styles.actionsHeading}>Действия</th>
            </tr></thead>
            <tbody>
              {checklists.map((checklist) => (
                <tr key={checklist.id}>
                  <td className={styles.idCell}>{checklist.id}</td>
                  <td className={styles.slugCell}>{checklist.slug}</td>
                  <td className={styles.titleCell}><strong>{checklist.title}</strong></td>
                  <td className={styles.textCell}>{checklist.subtitle || '—'}</td>
                  <td className={styles.textCell}>{checklist.intro}</td>
                  <td className={styles.textCell}>{checklist.description}</td>
                  <td className={styles.textCell}>{checklist.seoTitle}</td>
                  <td className={styles.textCell}>{checklist.seoDescription}</td>
                  <td><span className={`${styles.status} ${styles[checklist.status.toLowerCase() as 'draft' | 'published' | 'archived']}`}>{statusLabels[checklist.status]}</span></td>
                  <td className={styles.idCell}>{checklist.categoryId}</td>
                  <td>{checklist.category.title}</td>
                  <td className={styles.listCell}>
                    {checklist.tags.length > 0
                      ? <div className={styles.tags}>{checklist.tags.map(({ tag }) => <span key={tag.id}>{tag.title}</span>)}</div>
                      : '—'}
                  </td>
                  <td className={styles.listCell}>
                    {checklist.items.length > 0
                      ? <ol className={styles.items}>{checklist.items.map((item) => <li key={item.id}>{item.text}</li>)}</ol>
                      : '—'}
                  </td>
                  <td className={styles.listCell}>
                    <div className={styles.assetLinks}>
                      {checklistFiles.map((fileName) => (
                        <a
                          key={fileName}
                          href={new URL(`/checklists/${checklist.slug}/${fileName}`, publicSiteUrl).toString()}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {fileName}
                        </a>
                      ))}
                    </div>
                  </td>
                  <td className={styles.dateCell}>{formatDate(checklist.publishedAt)}</td>
                  <td className={styles.dateCell}>{formatDate(checklist.createdAt)}</td>
                  <td className={styles.dateCell}>{formatDate(checklist.updatedAt)}</td>
                  <td className={styles.actionsCell}><div className={styles.rowActions}>
                    <Link
                      className={styles.editLink}
                      href={`/admin/checklists/${checklist.id}/edit`}
                      aria-label={`Редактировать чек-лист «${checklist.title}»`}
                      title="Редактировать"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 20h4.2L19 9.2 14.8 5 4 15.8V20Zm2-3.4 8.8-8.8 1.4 1.4L7.4 18H6v-1.4ZM17.6 2.2a2 2 0 0 1 2.8 0l1.4 1.4a2 2 0 0 1 0 2.8L20.4 7.8 16.2 3.6l1.4-1.4Z" />
                      </svg>
                    </Link>
                    <form action={deleteChecklistAction.bind(null, checklist.id)}><DeleteChecklistButton title={checklist.title} /></form>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </DragScroll>
      )}
    </main>
  );
}
