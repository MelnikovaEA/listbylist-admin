import { notFound } from 'next/navigation';
import {ChecklistForm} from '@/src/features/checklists/ui/ChecklistForm/ChecklistForm';
import {
    checklistPreviewAssetQuery,
    getChecklistPreviewUrl,
} from '@/src/features/checklists/queries/checklistPreview';
import { prisma } from '@/src/lib/prisma';
import { updateChecklistAction } from './actions';
import {getCategoryOptions} from '@/src/features/categories/queries/getCategoryOptions';

export const runtime = 'nodejs';

type EditChecklistPageProps = {
    params: Promise<{ id: string }>;
};

export default async function EditChecklistPage({ params }: EditChecklistPageProps) {
    const {id} = await params;
    const [checklist, categories] = await Promise.all([
        prisma.checklist.findUnique({
        where: { id },
        include: {
            category: true,
            items: { orderBy: { sortOrder: 'asc' } },
            tags: { include: { tag: true } },
            assets: checklistPreviewAssetQuery,
        },
        }),
        getCategoryOptions(),
    ]);

    if (!checklist) {
        notFound();
    }

    const previewUrl = getChecklistPreviewUrl(checklist.assets);

    return (
        <ChecklistForm
            action={updateChecklistAction.bind(null, checklist.id)}
            categories={categories}
            initialPreviewUrl={previewUrl}
            initialValues={{
                title: checklist.title,
                slug: checklist.slug,
                categorySlug: checklist.category.slug,
                categoryTitle: checklist.category.title,
                categoryDescription: checklist.category.description,
                status: checklist.status,
                subtitle: checklist.subtitle ?? '',
                intro: checklist.intro,
                description: checklist.description,
                seoTitle: checklist.seoTitle,
                seoDescription: checklist.seoDescription,
                items: checklist.items.map((item) => item.text).join('\n'),
                tags: checklist.tags.map(({ tag }) => tag.title).join(', '),
            }}
        />
    );
}
