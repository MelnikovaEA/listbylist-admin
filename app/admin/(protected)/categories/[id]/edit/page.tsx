import {notFound} from 'next/navigation';
import {getCategoryForEdit} from '@/src/features/categories/queries/getCategoryForEdit';
import {CategoryForm} from '@/src/features/categories/ui/CategoryForm/CategoryForm';
import {getPublicAssetUrl} from '@/src/lib/storage/objectStorage';
import {updateCategoryAction} from './actions';

type EditCategoryPageProps = {
    params: Promise<{id: string}>;
};

export default async function EditCategoryPage({params}: EditCategoryPageProps) {
    const {id} = await params;
    const category = await getCategoryForEdit(id);

    if (!category) {
        notFound();
    }

    return <CategoryForm
        action={updateCategoryAction.bind(null, category.id)}
        slug={category.slug}
        iconUrl={category.iconKey ? getPublicAssetUrl(category.iconKey) : null}
        initialValues={{
            title: category.title,
            description: category.description,
        }}
    />;
}
