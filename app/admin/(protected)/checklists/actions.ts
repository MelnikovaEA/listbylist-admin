'use server';

import path from 'node:path';
import { rm } from 'node:fs/promises';
import { revalidatePath } from 'next/cache';
import { assertAdminActionEnabled } from '@/src/lib/admin/adminGuard';
import { prisma } from '@/src/lib/prisma';

export async function deleteChecklistAction(id: string) {
    assertAdminActionEnabled();

    const checklist = await prisma.checklist.findUnique({
        where: { id },
        select: { slug: true },
    });

    if (!checklist) {
        return;
    }

    await prisma.checklist.delete({ where: { id } });

    const publicSiteDir = process.env.PUBLIC_SITE_DIR
        ? path.resolve(process.env.PUBLIC_SITE_DIR)
        : path.resolve(process.cwd(), '..', 'checklist-site');
    const checklistsDir = path.resolve(publicSiteDir, 'public', 'checklists');
    const checklistDir = path.resolve(checklistsDir, checklist.slug);

    if (path.dirname(checklistDir) !== checklistsDir) {
        throw new Error('Некорректный путь к файлам чек-листа.');
    }

    await rm(checklistDir, { recursive: true, force: true });
    revalidatePath('/admin/checklists');
}
