import {deleteChecklistAction} from './actions';
import {getChecklistTableItems} from '@/src/features/checklists/queries/getChecklistTableItems';
import {ChecklistTable} from '@/src/features/checklists/ui/ChecklistTable/ChecklistTable';

export default async function AdminChecklistsPage() {
    const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const checklists = await getChecklistTableItems();

    return <ChecklistTable
        checklists={checklists}
        publicSiteUrl={publicSiteUrl}
        deleteAction={deleteChecklistAction}
    />;
}
