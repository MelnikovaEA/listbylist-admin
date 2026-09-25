import type {ComponentPropsWithoutRef, ReactNode} from 'react';
import styles from './FormLayout.module.css';

type FormLayoutProps = Omit<ComponentPropsWithoutRef<'form'>, 'className'>;

export function FormLayout(props: FormLayoutProps) {
    return <form className={styles.form} {...props} />;
}

type FormActionsProps = {
    children: ReactNode;
    hint?: ReactNode;
};

export function FormActions({children, hint}: FormActionsProps) {
    return <div className={styles.actions}>
        {children}
        {hint != null && <p className={styles.hint}>{hint}</p>}
    </div>;
}
