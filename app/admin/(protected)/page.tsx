import {PageHeader} from '@/src/components/PageHeader/PageHeader';
import Link from "next/link";
import styles from './adminPage.module.css';

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Администрирование"
        title="Обзор"
        description="Управление содержимым и настройками сайта."
      />

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
