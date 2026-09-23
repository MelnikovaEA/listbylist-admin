import 'server-only';

import sharp from 'sharp';
import {getCategoryIconKey, parseCategoryIconKey} from './contract';
import {
    MAX_CATEGORY_ICON_PIXELS,
    type ValidatedCategoryIcon,
} from './validation';
import {
    deleteObject,
    uploadObject,
    type UploadObjectInput,
} from '@/src/lib/storage/objectStorage';
import {createAssetVersion} from '@/src/lib/storage/objectVersion';

export const CATEGORY_ICON_SIZE = 512;

export type PreparedCategoryIcon = UploadObjectInput & {
    width: typeof CATEGORY_ICON_SIZE;
    height: typeof CATEGORY_ICON_SIZE;
    bytes: number;
};

type CategoryIconStorage = {
    upload: (input: UploadObjectInput) => Promise<void>;
    remove: (key: string) => Promise<void>;
};

const defaultStorage: CategoryIconStorage = {
    upload: uploadObject,
    remove: deleteObject,
};

function getContainedDimensions(width: number, height: number): {
    width: number;
    height: number;
} {
    const scale = Math.min(
        CATEGORY_ICON_SIZE / width,
        CATEGORY_ICON_SIZE / height,
        1,
    );

    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
    };
}

export async function prepareCategoryIcon(
    slug: string,
    source: ValidatedCategoryIcon,
    version = createAssetVersion(),
): Promise<PreparedCategoryIcon> {
    const contained = getContainedDimensions(source.width, source.height);
    const resized = await sharp(source.buffer, {
        limitInputPixels: MAX_CATEGORY_ICON_PIXELS,
        failOn: 'error',
    })
        .resize({
            width: contained.width,
            height: contained.height,
            fit: 'fill',
            withoutEnlargement: true,
        })
        .png()
        .toBuffer();
    const left = Math.floor((CATEGORY_ICON_SIZE - contained.width) / 2);
    const top = Math.floor((CATEGORY_ICON_SIZE - contained.height) / 2);
    const {data, info} = await sharp({
        create: {
            width: CATEGORY_ICON_SIZE,
            height: CATEGORY_ICON_SIZE,
            channels: 4,
            background: {r: 0, g: 0, b: 0, alpha: 0},
        },
    })
        .composite([{input: resized, left, top}])
        .png()
        .toBuffer({resolveWithObject: true});

    return {
        key: getCategoryIconKey(slug, version),
        body: data,
        contentType: 'image/png',
        contentDisposition: 'inline',
        width: CATEGORY_ICON_SIZE,
        height: CATEGORY_ICON_SIZE,
        bytes: info.size,
    };
}

export async function uploadCategoryIcon(
    icon: PreparedCategoryIcon,
    upload: CategoryIconStorage['upload'] = defaultStorage.upload,
): Promise<void> {
    await upload(icon);
}

export async function deleteCategoryIcon(
    key: string,
    expectedSlug: string,
    remove: CategoryIconStorage['remove'] = defaultStorage.remove,
): Promise<void> {
    const parsed = parseCategoryIconKey(key);

    if (!parsed || parsed.slug !== expectedSlug) {
        throw new Error('Некорректный S3-ключ иконки категории.');
    }

    await remove(key);
}
