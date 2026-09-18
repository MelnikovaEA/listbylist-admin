'use server';

import {revalidatePath} from 'next/cache';
import {assertAdminActionEnabled} from '@/src/lib/admin/adminGuard';
import {updateCategoryFromForm} from '@/src/features/categories/form/action';

export async function updateCategoryAction(id: string, formData: FormData) {
    assertAdminActionEnabled();
    const result = await updateCategoryFromForm(id, formData);

    if (result.success) {
        revalidatePath('/admin/categories');
        revalidatePath(`/admin/categories/${id}/edit`);
        revalidatePath('/admin/checklists');
        revalidatePath('/admin/checklists/new');
        revalidatePath('/admin/checklists/[id]/edit', 'page');
    }

    return result;
}
