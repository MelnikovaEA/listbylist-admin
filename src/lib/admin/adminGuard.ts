import { notFound } from 'next/navigation';

export function assertAdminPageEnabled() {
    if (process.env.ADMIN_ENABLED !== 'true') {
        notFound();
    }
}

export function assertAdminActionEnabled() {
    if (process.env.ADMIN_ENABLED !== 'true') {
        throw new Error('Admin is disabled');
    }
}
