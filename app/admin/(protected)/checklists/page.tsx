import {deleteChecklistAction} from './actions';
import {getChecklistTableItems} from '@/src/features/checklists/queries/getChecklistTableItems';
import {ChecklistTable} from '@/src/features/checklists/ui/ChecklistTable/ChecklistTable';

export default async function AdminChecklistsPage() {
    const checklists = await getChecklistTableItems();

    return <ChecklistTable
        checklists={checklists}
        deleteAction={deleteChecklistAction}
    />;
}
