import type {ChecklistFormActionResult} from '../../../form/action';
import styles from './FormFeedback.module.css';

type FormFeedbackProps = {
    actionResult: ChecklistFormActionResult | null;
    isEditing: boolean;
    onClose: () => void;
    unexpectedError: string;
};

type SuccessfulActionResult = Extract<
    ChecklistFormActionResult,
    {success: true}
>;

type SuccessFeedbackProps = {
    isEditing: boolean;
    onClose: () => void;
    result: SuccessfulActionResult;
};

function SuccessFeedback({isEditing, onClose, result}: SuccessFeedbackProps) {
    return <div className={styles.resultNotice}>
        <button
            className={styles.resultNoticeClose}
            type="button"
            onClick={onClose}
            aria-label="Закрыть уведомление"
        >×</button>
        <div className={styles.success} role="status">
            Чек-лист «{result.title}» {isEditing ? 'обновлён' : 'сохранён'}.
        </div>
        {result.warnings.length > 0 && <div className={styles.warning} role="alert">
            {result.warnings.join(' ')}
        </div>}
    </div>;
}

type ErrorFeedbackProps = {
    formErrors: string[];
    unexpectedError: string;
};

function ErrorFeedback({formErrors, unexpectedError}: ErrorFeedbackProps) {
    const message = unexpectedError || formErrors.join(' ');

    return message
        ? <div className={styles.error} role="alert">{message}</div>
        : null;
}

export function FormFeedback({
    actionResult,
    isEditing,
    onClose,
    unexpectedError,
}: FormFeedbackProps) {
    const formErrors = actionResult && !actionResult.success
        ? actionResult.formErrors
        : [];

    return <>
        {actionResult?.success && <SuccessFeedback
            isEditing={isEditing}
            onClose={onClose}
            result={actionResult}
        />}
        <ErrorFeedback
            formErrors={formErrors}
            unexpectedError={unexpectedError}
        />
    </>;
}
