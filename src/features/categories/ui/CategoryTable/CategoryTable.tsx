import {PageHeader} from '@/src/components/PageHeader/PageHeader';
import {TableContainer} from '@/src/components/TableContainer/TableContainer';
import {EmptyState} from '@/src/components/EmptyState/EmptyState';
import {ButtonLink} from '@/src/components/Button/ButtonLink';
import type {CategoryListItem} from '../../model/categoryListItem';
import styles from './CategoryTable.module.css';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

export function CategoryTable({categories}: {categories: CategoryListItem[]}) {
    return <>
        <PageHeader
            eyebrow="Контент"
            title="Категории"
            description={<>Всего: {categories.length}</>}
        />

        {categories.length === 0
            ? <EmptyState>Пока нет ни одной категории.</EmptyState>
            : <TableContainer>
                <table className={styles.table}>
                    <thead><tr>
                        <th>Slug</th>
                        <th>Название</th>
                        <th>Описание</th>
                        <th>Чек-листы</th>
                        <th>Создана</th>
                        <th>Обновлена</th>
                        <th>Действия</th>
                    </tr></thead>
                    <tbody>{categories.map((category) => <tr key={category.id}>
                        <td className={styles.slug}>{category.slug}</td>
                        <td><strong>{category.title}</strong></td>
                        <td className={styles.description}>{category.description}</td>
                        <td>{category.checklistCount}</td>
                        <td className={styles.date}>{dateFormatter.format(category.createdAt)}</td>
                        <td className={styles.date}>{dateFormatter.format(category.updatedAt)}</td>
                        <td><ButtonLink
                            variant="secondary"
                            size="icon"
                            href={`/admin/categories/${category.id}/edit`}
                            aria-label={`Редактировать категорию «${category.title}»`}
                            title="Редактировать"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M4 20h4.2L19 9.2 14.8 5 4 15.8V20Zm2-3.4 8.8-8.8 1.4 1.4L7.4 18H6v-1.4ZM17.6 2.2a2 2 0 0 1 2.8 0l1.4 1.4a2 2 0 0 1 0 2.8L20.4 7.8 16.2 3.6l1.4-1.4Z" />
                            </svg>
                        </ButtonLink></td>
                    </tr>)}</tbody>
                </table>
            </TableContainer>}
    </>;
}
