import 'server-only';

import {deleteObjectsByPrefix} from '@/src/lib/storage/objectStorage';
import {getChecklistStoragePrefix} from '../files/prefix';

export const CHECKLIST_FILES_CLEANUP_WARNING =
    'Чек-лист удалён, но не все его файлы удалось удалить из S3. В хранилище могли остаться лишние файлы.';

type DeleteChecklistDependencies = {
    findChecklist: (id: string) => Promise<{slug: string} | null>;
    deleteChecklistRecord: (id: string) => Promise<void>;
    deletePrefix: (prefix: string) => Promise<void>;
    logCleanupError: (message: string, error: unknown) => void;
};

const defaultDependencies: DeleteChecklistDependencies = {
    async findChecklist(id) {
        const {prisma} = await import('@/src/lib/prisma');

        return prisma.checklist.findUnique({
            where: {id},
            select: {slug: true},
        });
    },
    async deleteChecklistRecord(id) {
        const {prisma} = await import('@/src/lib/prisma');

        await prisma.checklist.delete({where: {id}});
    },
    deletePrefix: deleteObjectsByPrefix,
    logCleanupError: console.error,
};

export type DeleteChecklistResult = {
    deleted: boolean;
    warnings: string[];
};

export async function deleteChecklist(
    id: string,
    dependencies: DeleteChecklistDependencies = defaultDependencies,
): Promise<DeleteChecklistResult> {
    const checklist = await dependencies.findChecklist(id);

    if (!checklist) {
        return {deleted: false, warnings: []};
    }

    const prefix = getChecklistStoragePrefix(checklist.slug);
    await dependencies.deleteChecklistRecord(id);

    try {
        await dependencies.deletePrefix(prefix);
    } catch (cleanupError) {
        dependencies.logCleanupError(
            `Не удалось удалить файлы чек-листа ${id} из S3 по prefix ${prefix} после успешного удаления из БД.`,
            cleanupError,
        );

        return {
            deleted: true,
            warnings: [CHECKLIST_FILES_CLEANUP_WARNING],
        };
    }

    return {deleted: true, warnings: []};
}
