'use client';

import { useFormStatus } from 'react-dom';
import {Button} from '@/src/components/Button/Button';

type DeleteChecklistButtonProps = {
    title: string;
};

export function DeleteChecklistButton({ title }: DeleteChecklistButtonProps) {
    const { pending } = useFormStatus();

    return (
        <Button
            variant="danger"
            size="icon"
            type="submit"
            disabled={pending}
            aria-busy={pending}
            aria-label={`${pending ? 'Удаляется' : 'Удалить'} чек-лист «${title}»`}
            title={pending ? 'Удаление…' : 'Удалить'}
            onClick={(event) => {
                if (!window.confirm(`Удалить чек-лист «${title}» вместе с его файлами?`)) {
                    event.preventDefault();
                }
            }}
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" />
            </svg>
        </Button>
    );
}
