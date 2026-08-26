'use server';

import { redirect } from 'next/navigation';
import { assertAdminActionEnabled } from '@/src/lib/admin/adminGuard';
import { saveChecklist } from '@/src/lib/admin/saveChecklist';

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    return 'Неизвестная ошибка.';
}

export async function createChecklistAction(formData: FormData) {
    assertAdminActionEnabled();

    let createdTitle = '';

    try {
        const result = await saveChecklist(formData);
        createdTitle = result.title;
    } catch (error) {
        const message = getErrorMessage(error);

        redirect(
            `/admin/checklists/new?error=${encodeURIComponent(message)}`
        );
    }

    redirect(
        `/admin/checklists/new?created=${encodeURIComponent(createdTitle)}`
    );
}
