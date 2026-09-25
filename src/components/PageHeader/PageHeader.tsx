import type {ReactNode} from 'react';
import styles from './PageHeader.module.css';

type PageHeaderProps = {
    title: string;
    eyebrow?: string;
    description?: ReactNode;
    actions?: ReactNode;
};

export function PageHeader({title, eyebrow, description, actions}: PageHeaderProps) {
    return <header className={styles.header}>
        <div className={styles.content}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h1 className={styles.title}>{title}</h1>
            {description != null && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
    </header>;
}
