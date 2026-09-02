import {deleteChecklistAction} from './actions';
import {getChecklistTableItems} from '@/src/features/checklists/queries/getChecklistTableItems';
import {ChecklistTable} from '@/src/features/checklists/ui/ChecklistTable/ChecklistTable';

export default async function AdminChecklistsPage() {
    const checklists = await getChecklistTableItems();
    const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    return <ChecklistTable
        checklists={checklists}
        publicSiteUrl={publicSiteUrl}
        deleteAction={deleteChecklistAction}
    />;
}
