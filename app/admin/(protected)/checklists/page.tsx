import Link from "next/link";
import styles from "@/src/components/admin/AdminDashboard/AdminDashboard.module.css";

export default function AdminChecklistsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>Контент</p>
        <h1>Чек-листы</h1>
        <span>Таблица с редактированием и удалением появится на следующем этапе.</span>
      </header>

      <div className={styles.actions}>
        <Link href="/admin/checklists/new">Создать чек-лист</Link>
      </div>
    </main>
  );
}
