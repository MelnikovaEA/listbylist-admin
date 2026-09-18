import 'server-only';

import {getChecklistAssetBundleReference} from './contract';
import {getChecklistAssetPublicUrl} from './url';

export type ChecklistAssetLink = {
    name: string;
    url: string;
};

type StoredChecklistAsset = {
    type: string;
    url: string;
};

export function getChecklistAssetLinks(
    slug: string,
    assets: ReadonlyArray<StoredChecklistAsset>,
): ChecklistAssetLink[] {
    const downloadImageKey = assets.find(
        (asset) => asset.type === 'DOWNLOAD_IMAGE',
    )?.url;

    if (!downloadImageKey) {
        return [];
    }

    const bundle = getChecklistAssetBundleReference(downloadImageKey);
    if (!bundle || bundle.slug !== slug) {
        return [];
    }

    const links = bundle.assets.flatMap(({key}) => {
        const url = getChecklistAssetPublicUrl(key);

        return url
            ? [{name: key.slice(key.lastIndexOf('/') + 1), url}]
            : [];
    });

    if (links.length !== bundle.assets.length) {
        return [];
    }

    return links;
}
