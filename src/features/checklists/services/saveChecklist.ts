import {prisma} from '@/src/lib/prisma';
import {normalizeTagSlug} from '../model/slug';
import type {ChecklistFormValues} from '../form/schema';
import {ChecklistFormFieldError} from '../form/errors';
import {
    saveChecklistFiles,
} from './saveChecklistFiles';
import {
    deleteChecklistAssetBundle,
    type ChecklistAssetBundle,
} from '../files/bundle';
import {getChecklistAssetBundleReference} from '../files/contract';
import {
    applyChecklistAssetChanges,
    cleanupPreviousChecklistBundle,
    rollbackUploadedChecklistBundle,
} from './checklistAssetLifecycle';
import {resolveChecklistCategory} from '@/src/features/categories/services/resolveChecklistCategory';

function getAssetMetadata(file: {
    width: number | null;
    height: number | null;
    bytes: number | null;
    mimeType: string;
}) {
    return {
        width: file.width,
        height: file.height,
        bytes: file.bytes,
        mimeType: file.mimeType,
    };
}

type SaveChecklistDependencies = {
    saveFiles: typeof saveChecklistFiles;
    deleteBundle: typeof deleteChecklistAssetBundle;
    logCleanupError: (message: string, error: unknown) => void;
};

const defaultDependencies: SaveChecklistDependencies = {
    saveFiles: saveChecklistFiles,
    deleteBundle: deleteChecklistAssetBundle,
    logCleanupError: console.error,
};

export async function saveChecklist(
    values: ChecklistFormValues,
    formData: FormData,
    checklistId?: string,
    dependencies: SaveChecklistDependencies = defaultDependencies,
) {
    const {
        title,
        slug,
        categorySlug,
        categoryTitle,
        categoryDescription,
        subtitle,
        intro,
        description,
        seoTitle,
        seoDescription,
        status,
        items,
        tags,
    } = values;

    const existingChecklist = await prisma.checklist.findUnique({
        where: checklistId ? {id: checklistId} : {slug},
        select: {
            id: true,
            slug: true,
            publishedAt: true,
            assets: {
                select: {
                    type: true,
                    url: true,
                },
            },
        },
    });

    if (checklistId && !existingChecklist) {
        throw new Error('Чек-лист не найден.');
    }

    if (checklistId && existingChecklist?.slug !== slug) {
        throw new ChecklistFormFieldError('slug', 'Slug существующего чек-листа нельзя изменить.');
    }

    if (!checklistId && existingChecklist) {
        throw new ChecklistFormFieldError('slug', 'Чек-лист с таким slug уже существует.');
    }

    const previousBundle = checklistId
        ? getChecklistAssetBundleReference(
            existingChecklist?.assets.find((asset) => asset.type === 'DOWNLOAD_IMAGE')?.url ?? '',
        )
        : null;
    const savedFiles = await dependencies.saveFiles(
        slug,
        formData,
        checklistId ? 'edit' : 'create',
    );
    const uploadedBundle: ChecklistAssetBundle | null = savedFiles.changed
        ? savedFiles.bundle
        : null;

    if (status === 'PUBLISHED') {
        const hasAsset = (type: 'PREVIEW_IMAGE' | 'VIEW_IMAGE' | 'DOWNLOAD_IMAGE' | 'PDF') =>
            savedFiles.changed
                ? {
                    PREVIEW_IMAGE: savedFiles.fileState.preview.exists,
                    VIEW_IMAGE: savedFiles.fileState.view.exists,
                    DOWNLOAD_IMAGE: savedFiles.fileState.image.exists,
                    PDF: savedFiles.fileState.pdf.exists,
                }[type]
                : existingChecklist?.assets.some((asset) => asset.type === type) ?? false;

        if (!hasAsset('PREVIEW_IMAGE')) {
            throw new Error('Не удалось создать preview.webp.');
        }

        if (!hasAsset('VIEW_IMAGE')) {
            throw new Error('Не удалось создать view.webp.');
        }

        if (!hasAsset('DOWNLOAD_IMAGE')) {
            throw new Error('Для публикации нужен checklist.png.');
        }

        if (!hasAsset('PDF')) {
            throw new Error('Для публикации нужен checklist.pdf.');
        }
    }

    try {
        await prisma.$transaction(async (tx) => {
            const category = await resolveChecklistCategory(tx, {
                slug: categorySlug,
                title: categoryTitle,
                description: categoryDescription,
            });

            const checklistData = {
                title,
                subtitle: subtitle || null,
                intro,
                description,
                seoTitle,
                seoDescription,
                status,
                categoryId: category.id,
                publishedAt:
                    status === 'PUBLISHED'
                        ? existingChecklist?.publishedAt ?? new Date()
                        : null,
            };
            const checklist = existingChecklist
                ? await tx.checklist.update({
                    where: {id: existingChecklist.id},
                    data: checklistData,
                })
                : await tx.checklist.create({
                    data: {
                        slug,
                        ...checklistData,
                    },
                });

            await tx.checklistItem.deleteMany({
                where: {
                    checklistId: checklist.id,
                },
            });

            await tx.checklistTag.deleteMany({
                where: {
                    checklistId: checklist.id,
                },
            });

            await tx.checklistItem.createMany({
                data: items.map((text, index) => ({
                    text,
                    sortOrder: index + 1,
                    checklistId: checklist.id,
                })),
            });

            await applyChecklistAssetChanges(savedFiles, async (fileState) => {
                await tx.checklistAsset.deleteMany({
                    where: {
                        checklistId: checklist.id,
                    },
                });

                const assets = [];

                if (fileState.preview.exists) {
                assets.push({
                    type: 'PREVIEW_IMAGE' as const,
                    url: fileState.preview.url,
                    alt: `Превью чек-листа: ${title}`,
                    sortOrder: 1,
                    checklistId: checklist.id,
                    ...getAssetMetadata(fileState.preview),
                });
                }

                if (fileState.view.exists) {
                assets.push({
                    type: 'VIEW_IMAGE' as const,
                    url: fileState.view.url,
                    alt: `Чек-лист для просмотра: ${title}`,
                    sortOrder: 2,
                    checklistId: checklist.id,
                    ...getAssetMetadata(fileState.view),
                });
                }

                if (fileState.image.exists) {
                assets.push({
                    type: 'DOWNLOAD_IMAGE' as const,
                    url: fileState.image.url,
                    alt: `Картинка чек-листа: ${title}`,
                    sortOrder: 3,
                    checklistId: checklist.id,
                    ...getAssetMetadata(fileState.image),
                });
                }

                if (fileState.pdf.exists) {
                assets.push({
                    type: 'PDF' as const,
                    url: fileState.pdf.url,
                    alt: `PDF чек-листа: ${title}`,
                    sortOrder: 4,
                    checklistId: checklist.id,
                    ...getAssetMetadata(fileState.pdf),
                });
                }

                if (assets.length > 0) {
                    await tx.checklistAsset.createMany({
                        data: assets,
                    });
                }
            });

            for (const tagTitle of tags) {
                const tagSlug = normalizeTagSlug(tagTitle);

                if (!tagSlug) {
                    continue;
                }

                const tag = await tx.tag.upsert({
                    where: {
                        slug: tagSlug,
                    },
                    update: {},
                    create: {
                        slug: tagSlug,
                        title: tagTitle,
                    },
                });

                await tx.checklistTag.create({
                    data: {
                        checklistId: checklist.id,
                        tagId: tag.id,
                    },
                });
            }
        });
    } catch (databaseError) {
        await rollbackUploadedChecklistBundle(
            databaseError,
            uploadedBundle,
            dependencies.deleteBundle,
        );
    }

    const warnings = await cleanupPreviousChecklistBundle(
        uploadedBundle,
        previousBundle,
        dependencies.deleteBundle,
        dependencies.logCleanupError,
    );

    return {
        title,
        slug,
        warnings,
    };
}
