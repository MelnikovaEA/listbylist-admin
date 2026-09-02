'use server';

import { revalidatePath } from 'next/cache';
import { assertAdminActionEnabled } from '@/src/lib/admin/adminGuard';
import {saveChecklistFromForm} from '@/src/features/checklists/form/action';

export async function updateChecklistAction(id: string, formData: FormData) {
    assertAdminActionEnabled();

    const result = await saveChecklistFromForm(formData, id);

    if (result.success) {
        revalidatePath('/admin/checklists');
        revalidatePath(`/admin/checklists/${id}/edit`);
    }

    return result;
}
