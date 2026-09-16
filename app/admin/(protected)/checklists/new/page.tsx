import {ChecklistForm} from '@/src/features/checklists/ui/ChecklistForm/ChecklistForm';
import {getCategoryOptions} from '@/src/features/categories/queries/getCategoryOptions';

export const runtime = "nodejs";

export default async function NewChecklistPage() {
  const categories = await getCategoryOptions();

  return (
    <main>
      <ChecklistForm categories={categories} />
    </main>
  );
}
