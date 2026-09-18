import Link from 'next/link';
import type {CategoryListItem} from '../../model/categoryListItem';
import styles from './CategoryTable.module.css';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

export function CategoryTable({categories}: {categories: CategoryListItem[]}) {
    return <main className={styles.page}>
        <header className={styles.header}>
            <p>Контент</p>
            <h1>Категории</h1>
            <span>Всего: {categories.length}</span>
        </header>

        {categories.length === 0
            ? <div className={styles.empty}>Пока нет ни одной категории.</div>
            : <div className={styles.tableWrap}>
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
                        <td><Link className={styles.editLink} href={`/admin/categories/${category.id}/edit`}>
                            Редактировать
                        </Link></td>
                    </tr>)}</tbody>
                </table>
            </div>}
    </main>;
}
