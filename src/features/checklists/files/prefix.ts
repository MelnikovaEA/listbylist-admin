import {validateLatinSlug} from '../model/slug';

export function getChecklistStoragePrefix(slug: string): string {
    if (!validateLatinSlug(slug)) {
        throw new Error('Некорректный slug чек-листа для удаления файлов из S3.');
    }

    return `checklists/${slug}/`;
}
