import styles from './ChecklistForm.module.css';

export function FieldTooltip({text}: { text: string }) {
    return <span className={styles.tooltipWrap}>
        <span className={styles.tooltipTrigger} tabIndex={0} aria-label={text}>?</span>
        <span className={styles.tooltipBubble} role="tooltip">{text}</span>
    </span>;
}

export function FieldError({message}: { message?: string }) {
    return message ? <span className={styles.fieldError}>{message}</span> : null;
}
