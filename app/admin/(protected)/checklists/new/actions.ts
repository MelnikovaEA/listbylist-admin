'use server';

import { assertAdminActionEnabled } from '@/src/lib/admin/adminGuard';
import {saveChecklistFromForm} from '@/src/features/checklists/form/action';

export async function createChecklistAction(formData: FormData) {
    assertAdminActionEnabled();
    return saveChecklistFromForm(formData);
}
