type CategoryClient = {
    category: {
        upsert: (arguments_: {
            where: {slug: string};
            update: Record<string, never>;
            create: {
                slug: string;
                title: string;
                description: string;
            };
        }) => Promise<{id: string}>;
    };
};

type ResolveChecklistCategoryInput = {
    slug: string;
    title: string;
    description: string;
};

export async function resolveChecklistCategory(
    client: CategoryClient,
    {slug, title, description}: ResolveChecklistCategoryInput,
) {
    return await client.category.upsert({
        where: {slug},
        update: {},
        create: {
            slug,
            title,
            description,
        },
    });
}
