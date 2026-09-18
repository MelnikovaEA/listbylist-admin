import {getCategoryListItems} from '@/src/features/categories/queries/getCategoryListItems';
import {CategoryTable} from '@/src/features/categories/ui/CategoryTable/CategoryTable';

export default async function AdminCategoriesPage() {
    const categories = await getCategoryListItems();

    return <CategoryTable categories={categories} />;
}
