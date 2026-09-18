import 'server-only';

import type {ChecklistAssetBundle} from '../files/bundle';
import type {ChecklistAssetBundleReference} from '../files/contract';
import {deleteChecklistAssetBundle} from '../files/bundle';
import type {
    ChecklistFileState,
    SavedChecklistFiles,
} from './saveChecklistFiles';

type DeleteBundle = typeof deleteChecklistAssetBundle;
type LogCleanupError = (message: string, error: unknown) => void;

export const PREVIOUS_BUNDLE_CLEANUP_WARNING =
    'Чек-лист сохранён, но предыдущую версию файлов не удалось удалить из S3. В хранилище могли остаться лишние файлы.';

export async function applyChecklistAssetChanges(
    savedFiles: SavedChecklistFiles,
    replaceAssets: (fileState: ChecklistFileState) => Promise<void>,
): Promise<void> {
    if (savedFiles.changed) {
        await replaceAssets(savedFiles.fileState);
    }
}

export async function rollbackUploadedChecklistBundle(
    databaseError: unknown,
    uploadedBundle: ChecklistAssetBundle | null,
    deleteBundle: DeleteBundle,
): Promise<never> {
    if (!uploadedBundle) {
        throw databaseError;
    }

    try {
        await deleteBundle(uploadedBundle);
    } catch (cleanupError) {
        throw new AggregateError(
            [databaseError, cleanupError],
            'Не удалось сохранить чек-лист в БД и полностью удалить его файлы из хранилища.',
        );
    }

    throw databaseError;
}

export async function cleanupPreviousChecklistBundle(
    uploadedBundle: ChecklistAssetBundle | null,
    previousBundle: ChecklistAssetBundleReference | null,
    deleteBundle: DeleteBundle,
    logCleanupError: LogCleanupError,
): Promise<string[]> {
    if (!uploadedBundle || !previousBundle) {
        return [];
    }

    try {
        await deleteBundle(previousBundle);
    } catch (cleanupError) {
        logCleanupError(
            'Не удалось удалить предыдущий комплект файлов чек-листа из S3 после успешного сохранения.',
            cleanupError,
        );
        return [PREVIOUS_BUNDLE_CLEANUP_WARNING];
    }

    return [];
}
