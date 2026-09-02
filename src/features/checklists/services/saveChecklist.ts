import {prisma} from '@/src/lib/prisma';
import {normalizeTagSlug} from '../model/slug';
import type {ChecklistFormValues} from '../form/schema';
import {ChecklistFormFieldError} from '../form/errors';
import {
    saveChecklistFiles,
    saveLegacyChecklistFiles,
} from './saveChecklistFiles';
import {
    deleteChecklistAssetBundle,
    type ChecklistAssetBundle,
} from '../files/bundle';

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

export async function saveChecklist(
    values: ChecklistFormValues,
    formData: FormData,
    checklistId?: string,
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

    let uploadedBundle: ChecklistAssetBundle | null = null;
    const fileState = checklistId
        ? await saveLegacyChecklistFiles(slug, formData)
        : await saveChecklistFiles(slug, formData).then((uploaded) => {
            uploadedBundle = uploaded.bundle;
            return uploaded.fileState;
        });

    if (status === 'PUBLISHED') {
        if (!fileState.preview.exists) {
            throw new Error('Не удалось создать preview.webp.');
        }

        if (!fileState.view.exists) {
            throw new Error('Не удалось создать view.webp.');
        }

        if (!fileState.image.exists) {
            throw new Error('Для публикации нужен checklist.png.');
        }

        if (!fileState.pdf.exists) {
            throw new Error('Для публикации нужен checklist.pdf.');
        }
    }

    try {
        await prisma.$transaction(async (tx) => {
            const category = await tx.category.upsert({
                where: {
                    slug: categorySlug,
                },
                update: {
                    title: categoryTitle,
                    description: categoryDescription,
                },
                create: {
                    slug: categorySlug,
                    title: categoryTitle,
                    description: categoryDescription,
                },
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

            await tx.checklistAsset.deleteMany({
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

            for (const tagTitle of tags) {
                const tagSlug = normalizeTagSlug(tagTitle);

                if (!tagSlug) {
                    continue;
                }

                const tag = await tx.tag.upsert({
                    where: {
                        slug: tagSlug,
                    },
                    update: {
                        title: tagTitle,
                    },
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
        if (!uploadedBundle) {
            throw databaseError;
        }

        try {
            await deleteChecklistAssetBundle(uploadedBundle);
        } catch (cleanupError) {
            throw new AggregateError(
                [databaseError, cleanupError],
                'Не удалось сохранить чек-лист в БД и полностью удалить его файлы из хранилища.',
            );
        }

        throw databaseError;
    }

    return {
        title,
        slug,
        fileState,
    };
}
