'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { assertAdminActionEnabled } from '@/src/lib/admin/adminGuard';
import { saveChecklist } from '@/src/lib/admin/saveChecklist';

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Неизвестная ошибка.';
}

export async function updateChecklistAction(id: string, formData: FormData) {
    assertAdminActionEnabled();

    let updatedTitle = '';

    try {
        const result = await saveChecklist(formData, id);
        updatedTitle = result.title;
    } catch (error) {
        redirect(`/admin/checklists/${id}/edit?error=${encodeURIComponent(getErrorMessage(error))}`);
    }

    revalidatePath('/admin/checklists');
    redirect(`/admin/checklists/${id}/edit?updated=${encodeURIComponent(updatedTitle)}`);
}
