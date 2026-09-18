import type {ReactNode} from 'react';
import {FieldError} from '../FieldFeedback/FieldFeedback';
import styles from './FormField.module.css';

type FormFieldProps = {
    children: ReactNode;
    error?: string;
    hint?: ReactNode;
    hintId?: string;
    label: ReactNode;
};

export function FormField({
    children,
    error,
    hint,
    hintId,
    label,
}: FormFieldProps) {
    return <label className={styles.field}>
        <span className={styles.label}>{label}</span>
        {children}
        {hint && <small className={styles.hint} id={hintId}>{hint}</small>}
        <FieldError message={error} />
    </label>;
}
