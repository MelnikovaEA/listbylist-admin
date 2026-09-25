import Link from "next/link";
import styles from './adminPage.module.css';

export default function AdminDashboardPage() {
  return (
    <>
      <header className={styles.header}>
        <p>Администрирование</p>
        <h1>Обзор</h1>
        <span>Управление содержимым и настройками сайта.</span>
      </header>

      <div className={styles.cards}>
        <Link href="/admin/checklists">
          <strong>Чек-листы</strong>
          <span>Просмотр, редактирование и удаление чек-листов.</span>
        </Link>
        <Link href="/admin/categories">
          <strong>Категории</strong>
          <span>Просмотр и редактирование категорий чек-листов.</span>
        </Link>
        <Link href="/admin/settings">
          <strong>Настройки</strong>
          <span>Реклама и другие параметры сайта.</span>
        </Link>
      </div>
    </>
  );
}
