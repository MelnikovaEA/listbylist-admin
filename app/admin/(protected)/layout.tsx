import type { ReactNode } from "react";
import Link from "next/link";
import { assertAdminPageEnabled } from "@/src/lib/admin/adminGuard";
import styles from "@/src/components/admin/AdminShell/AdminShell.module.css";

export default function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  assertAdminPageEnabled();
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/admin">
          Лист за листом
          <span>Админка</span>
        </Link>

        <nav className={styles.navigation} aria-label="Навигация админки">
          <Link href="/admin">Обзор</Link>
          <Link href="/admin/checklists">Чек-листы</Link>
          <Link href="/admin/checklists/new">Новый чек-лист</Link>
          <Link href="/admin/settings">Настройки</Link>
        </nav>

        <a className={styles.siteLink} href={publicSiteUrl}>
          Перейти на сайт
        </a>
      </aside>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
