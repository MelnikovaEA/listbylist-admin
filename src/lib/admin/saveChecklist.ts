import {prisma} from '@/src/lib/prisma';
import {normalizeSlug, normalizeTagSlug, validateLatinSlug} from './slug';
import {
    saveChecklistFiles,
    saveLegacyChecklistFiles,
} from './saveChecklistFiles';
import {
    deleteChecklistAssetBundle,
    type ChecklistAssetBundle,
} from './checklistAssetBundle';

type ChecklistStatusValue = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

function isChecklistStatus(
    value: string,
): value is ChecklistStatusValue {
    return (
        value === 'DRAFT' ||
        value === 'PUBLISHED' ||
        value === 'ARCHIVED'
    );
}

function getString(formData: FormData, key: string) {
    const value = formData.get(key);

    if (typeof value !== 'string') {
        return '';
    }

    return value.trim();
}

function getLines(formData: FormData, key: string) {
    return getString(formData, key)
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
}

function getTags(formData: FormData, key: string) {
    return getString(formData, key)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function getStatus(formData: FormData): ChecklistStatusValue {
    const status = getString(formData, 'status');

    return isChecklistStatus(status) ? status : 'DRAFT';
}

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

export async function saveChecklist(formData: FormData, checklistId?: string) {
    const title = getString(formData, 'title');
    const slug = normalizeSlug(getString(formData, 'slug'));

    const categorySlug = normalizeSlug(getString(formData, 'categorySlug'));
    const categoryTitle = getString(formData, 'categoryTitle');
    const categoryDescription =
        getString(formData, 'categoryDescription') ||
        `Чек-листы из категории «${categoryTitle}».`;

    const subtitle = getString(formData, 'subtitle');
    const intro = getString(formData, 'intro');
    const description = getString(formData, 'description');

    const seoTitle = getString(formData, 'seoTitle');
    const seoDescription = getString(formData, 'seoDescription');

    const status = getStatus(formData);
    const items = getLines(formData, 'items');
    const tags = getTags(formData, 'tags');

    if (!title) {
        throw new Error('Заполни название чек-листа.');
    }

    if (!slug || !validateLatinSlug(slug)) {
        throw new Error('Slug чек-листа должен быть латиницей: letniy-piknik.');
    }

    if (!categorySlug || !validateLatinSlug(categorySlug)) {
        throw new Error('Slug категории должен быть латиницей: seasonal, home, travel.');
    }

    if (!categoryTitle) {
        throw new Error('Заполни название категории.');
    }

    if (!intro) {
        throw new Error('Заполни intro.');
    }

    if (!description) {
        throw new Error('Заполни описание.');
    }

    if (!seoTitle) {
        throw new Error('Заполни SEO title.');
    }

    if (!seoDescription) {
        throw new Error('Заполни SEO description.');
    }

    if (items.length === 0) {
        throw new Error('Добавь хотя бы один пункт чек-листа.');
    }

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
        throw new Error('Slug существующего чек-листа нельзя изменить.');
    }

    if (!checklistId && existingChecklist) {
        throw new Error('Чек-лист с таким slug уже существует.');
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
