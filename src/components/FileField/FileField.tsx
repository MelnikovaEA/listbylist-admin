'use client';

import {useId, useRef, type ReactNode, type RefObject} from 'react';
import {Button} from '../Button/Button';
import {FieldError, FieldTooltip} from '../FieldFeedback/FieldFeedback';
import styles from './FileField.module.css';

type FileFieldProps = {
    name: string;
    label: string;
    accept: string;
    hint?: string;
    error?: string;
    disabled?: boolean;
    hasSelectedFile: boolean;
    onFileChange: (file: File | null) => void;
    inputRef?: RefObject<HTMLInputElement | null>;
    children?: ReactNode;
};

export function FileField({
    name, label, accept, hint, error, disabled, hasSelectedFile,
    onFileChange, inputRef, children,
}: FileFieldProps) {
    const id = useId();
    const localRef = useRef<HTMLInputElement>(null);
    const ref = inputRef ?? localRef;
    const errorId = `${id}-error`;

    const clearSelection = () => {
        const input = ref.current;
        if (!input) return;

        input.value = '';
        // Notify both this field and the containing form, just like a new selection.
        input.dispatchEvent(new Event('change', {bubbles: true}));
        input.focus();
    };

    return <div className={styles.field}>
        <div className={styles.labelRow}>
            <label htmlFor={id}>{label}</label>
            {hint && <FieldTooltip text={hint} />}
        </div>
        <input
            className={styles.input}
            ref={ref}
            id={id}
            name={name}
            type="file"
            accept={accept}
            disabled={disabled}
            onChange={(event) => onFileChange(event.currentTarget.files?.[0] ?? null)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
        />
        {error && <div id={errorId}><FieldError message={error} /></div>}
        {children}
        {hasSelectedFile && <Button
            variant="secondary"
            disabled={disabled}
            onClick={clearSelection}
            aria-label={`Отменить выбор ${label}`}
        >Отменить выбор</Button>}
    </div>;
}
