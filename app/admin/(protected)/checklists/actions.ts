'use server';

import { revalidatePath } from 'next/cache';
import { assertAdminActionEnabled } from '@/src/lib/admin/adminGuard';
import {
    deleteChecklist,
    type DeleteChecklistResult,
} from '@/src/features/checklists/services/deleteChecklist';

export async function deleteChecklistAction(
    previousState: DeleteChecklistResult,
    formData: FormData,
): Promise<DeleteChecklistResult> {
    assertAdminActionEnabled();
    const id = formData.get('id');

    if (typeof id !== 'string' || !id) {
        return previousState;
    }

    const result = await deleteChecklist(id);
    revalidatePath('/admin/checklists');

    return result;
}
