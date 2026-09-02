import { notFound } from 'next/navigation';
import {ChecklistForm} from '@/src/features/checklists/ui/ChecklistForm/ChecklistForm';
import { prisma } from '@/src/lib/prisma';
import { updateChecklistAction } from './actions';

export const runtime = 'nodejs';

type EditChecklistPageProps = {
    params: Promise<{ id: string }>;
};

export default async function EditChecklistPage({ params }: EditChecklistPageProps) {
    const {id} = await params;
    const checklist = await prisma.checklist.findUnique({
        where: { id },
        include: {
            category: true,
            items: { orderBy: { sortOrder: 'asc' } },
            tags: { include: { tag: true } },
        },
    });

    if (!checklist) {
        notFound();
    }

    return (
        <main>
            <ChecklistForm
                action={updateChecklistAction.bind(null, checklist.id)}
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
        </main>
    );
}
