import type {ReactNode} from 'react';
import styles from './FormFeedback.module.css';

type FormSuccessFeedbackProps = {
    message: ReactNode;
    onCloseAction?: () => void;
    warnings?: string[];
};

export function FormSuccessFeedback({
    message,
    onCloseAction,
    warnings = [],
}: FormSuccessFeedbackProps) {
    return <div className={styles.resultNotice}>
        {onCloseAction && <button
            className={styles.resultNoticeClose}
            type="button"
            onClick={onCloseAction}
            aria-label="Закрыть уведомление"
        >×</button>}
        <div className={styles.success} role="status">
            {message}
        </div>
        {warnings.length > 0 && <div className={styles.warning} role="alert">
            {warnings.join(' ')}
        </div>}
    </div>;
}

type FormErrorFeedbackProps = {
    message?: string;
};

export function FormErrorFeedback({message}: FormErrorFeedbackProps) {
    return message
        ? <div className={styles.error} role="alert">{message}</div>
        : null;
}
