export type ChecklistTableItem = {
    id: string;
    slug: string;
    title: string;
    previewUrl: string | null;
    subtitle: string | null;
    intro: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    categoryId: string;
    categoryTitle: string;
    tags: Array<{id: string; title: string}>;
    items: Array<{id: string; text: string}>;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};
