import styles from '../adminPage.module.css';

export default function AdminSettingsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>Сайт</p>
        <h1>Настройки</h1>
        <span>Здесь появятся управление рекламой и другие параметры сайта.</span>
      </header>
    </main>
  );
}
