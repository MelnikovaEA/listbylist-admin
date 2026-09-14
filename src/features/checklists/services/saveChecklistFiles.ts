import 'server-only';

import {
    prepareChecklistAssetBundle,
    uploadChecklistAssetBundle,
    type ChecklistAssetBundle,
    type PreparedChecklistAsset,
} from '../files/bundle';
import {
    isUploadedFile,
    validatePdf,
    validatePng,
} from '../files/validation';
import {ChecklistFormFieldError} from '../form/errors';

type ChecklistFileAsset = {
    exists: boolean;
    url: string;
    sizeKb: number | null;
    bytes: number | null;
    width: number | null;
    height: number | null;
    mimeType: string;
};

export type ChecklistFileState = {
    preview: ChecklistFileAsset;
    view: ChecklistFileAsset;
    image: ChecklistFileAsset;
    pdf: ChecklistFileAsset;
};

export type SavedChecklistFiles =
    | {changed: false}
    | {
        changed: true;
        fileState: ChecklistFileState;
        bundle: ChecklistAssetBundle;
    };

type FileStorageOperations = {
    upload: typeof uploadChecklistAssetBundle;
};

const defaultStorage: FileStorageOperations = {
    upload: uploadChecklistAssetBundle,
};

function getValidationErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Не удалось проверить файл.';
}

function getPreparedAsset(
    bundle: ChecklistAssetBundle,
    role: PreparedChecklistAsset['role'],
): PreparedChecklistAsset {
    const asset = bundle.assets.find((candidate) => candidate.role === role);

    if (!asset) {
        throw new Error(`В комплекте отсутствует обязательный файл ${role}.`);
    }

    return asset;
}

function toFileAsset(asset: PreparedChecklistAsset): ChecklistFileAsset {
    return {
        exists: true,
        url: asset.key,
        sizeKb: Math.round(asset.bytes / 1024),
        bytes: asset.bytes,
        width: asset.width,
        height: asset.height,
        mimeType: asset.contentType,
    };
}

export async function saveChecklistFiles(
    slug: string,
    formData: FormData,
    mode: 'create' | 'edit',
    storage: FileStorageOperations = defaultStorage,
): Promise<SavedChecklistFiles> {
    const imageEntry = formData.get('image');
    const pdfEntry = formData.get('pdf');
    const imageUploaded = isUploadedFile(imageEntry);
    const pdfUploaded = isUploadedFile(pdfEntry);

    if (mode === 'edit' && !imageUploaded && !pdfUploaded) {
        return {changed: false};
    }

    if (mode === 'create' && !imageUploaded) {
        throw new ChecklistFormFieldError('image', 'Загрузи checklist.png.');
    }

    if (mode === 'create' && !pdfUploaded) {
        throw new ChecklistFormFieldError('pdf', 'Загрузи checklist.pdf.');
    }

    if (imageUploaded && !pdfUploaded) {
        throw new ChecklistFormFieldError(
            'pdf',
            'При замене checklist.png также загрузи новый checklist.pdf.',
        );
    }

    if (pdfUploaded && !imageUploaded) {
        throw new ChecklistFormFieldError(
            'image',
            'При замене checklist.pdf также загрузи новый checklist.png.',
        );
    }

    if (!imageUploaded || !pdfUploaded) {
        throw new Error('Не удалось определить комплект файлов чек-листа.');
    }

    const [validatedPng, validatedPdf] = await Promise.all([
        validatePng(imageEntry).catch((error) => {
            throw new ChecklistFormFieldError(
                'image',
                getValidationErrorMessage(error),
                {cause: error},
            );
        }),
        validatePdf(pdfEntry).catch((error) => {
            throw new ChecklistFormFieldError(
                'pdf',
                getValidationErrorMessage(error),
                {cause: error},
            );
        }),
    ]);
    const bundle = await prepareChecklistAssetBundle({
        slug,
        png: validatedPng,
        pdf: validatedPdf,
    });

    await storage.upload(bundle);

    return {
        changed: true,
        bundle,
        fileState: {
            preview: toFileAsset(getPreparedAsset(bundle, 'PREVIEW_960')),
            view: toFileAsset(getPreparedAsset(bundle, 'VIEW')),
            image: toFileAsset(getPreparedAsset(bundle, 'DOWNLOAD_IMAGE')),
            pdf: toFileAsset(getPreparedAsset(bundle, 'PDF')),
        },
    };
}
