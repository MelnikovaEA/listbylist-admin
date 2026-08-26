import path from 'node:path';
import { existsSync } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

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

function isUploadedFile(value: FormDataEntryValue | null): value is File {
    return value instanceof File && value.size > 0;
}

function assertFileExtension(file: File, allowedExtensions: string[], label: string) {
    const extension = path.extname(file.name).toLowerCase();

    if (!allowedExtensions.includes(extension)) {
        throw new Error(`${label}: неправильный формат файла. Можно: ${allowedExtensions.join(', ')}`);
    }
}

async function readImageAsset(filePath: string, url: string, mimeType: string): Promise<ChecklistFileAsset> {
    if (!existsSync(filePath)) {
        return { exists: false, url, sizeKb: null, bytes: null, width: null, height: null, mimeType };
    }

    const [fileStat, metadata] = await Promise.all([stat(filePath), sharp(filePath).metadata()]);

    return {
        exists: true,
        url,
        sizeKb: Math.round(fileStat.size / 1024),
        bytes: fileStat.size,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        mimeType,
    };
}

async function readDocumentAsset(filePath: string, url: string): Promise<ChecklistFileAsset> {
    if (!existsSync(filePath)) {
        return { exists: false, url, sizeKb: null, bytes: null, width: null, height: null, mimeType: 'application/pdf' };
    }

    const fileStat = await stat(filePath);

    return {
        exists: true,
        url,
        sizeKb: Math.round(fileStat.size / 1024),
        bytes: fileStat.size,
        width: null,
        height: null,
        mimeType: 'application/pdf',
    };
}

async function createWebpVariants(source: Buffer, checklistDir: string, viewPath: string) {
    await Promise.all([
        ...[400, 640, 960].map((width) =>
            sharp(source)
                .resize({ width, withoutEnlargement: true })
                .webp({ quality: 86, effort: 4 })
                .toFile(path.join(checklistDir, `preview-${width}.webp`)),
        ),
        sharp(source)
            .resize({ width: 1200, withoutEnlargement: true })
            .webp({ quality: 88, effort: 4 })
            .toFile(viewPath),
    ]);
}

export async function saveChecklistFiles(slug: string, formData: FormData): Promise<ChecklistFileState> {
    const publicSiteDir = process.env.PUBLIC_SITE_DIR
        ? path.resolve(process.env.PUBLIC_SITE_DIR)
        : path.resolve(process.cwd(), '..', 'checklist-site');
    const checklistDir = path.join(publicSiteDir, 'public', 'checklists', slug);
    await mkdir(checklistDir, { recursive: true });

    const previewPath = path.join(checklistDir, 'preview-960.webp');
    const viewPath = path.join(checklistDir, 'view.webp');
    const imagePath = path.join(checklistDir, 'checklist.png');
    const pdfPath = path.join(checklistDir, 'checklist.pdf');
    const image = formData.get('image');
    const pdf = formData.get('pdf');

    if (isUploadedFile(image)) {
        assertFileExtension(image, ['.png'], 'Картинка');
        const source = Buffer.from(await image.arrayBuffer());
        const metadata = await sharp(source).metadata();

        if (metadata.format !== 'png') {
            throw new Error('Картинка должна быть настоящим PNG-файлом.');
        }

        await writeFile(imagePath, source);
        await createWebpVariants(source, checklistDir, viewPath);
    } else if (
        existsSync(imagePath) &&
        (![400, 640, 960].every((width) => existsSync(path.join(checklistDir, `preview-${width}.webp`))) || !existsSync(viewPath))
    ) {
        await createWebpVariants(await readFile(imagePath), checklistDir, viewPath);
    }

    if (isUploadedFile(pdf)) {
        assertFileExtension(pdf, ['.pdf'], 'PDF');
        await writeFile(pdfPath, Buffer.from(await pdf.arrayBuffer()));
    }

    return {
        preview: await readImageAsset(previewPath, `/checklists/${slug}/preview-960.webp`, 'image/webp'),
        view: await readImageAsset(viewPath, `/checklists/${slug}/view.webp`, 'image/webp'),
        image: await readImageAsset(imagePath, `/checklists/${slug}/checklist.png`, 'image/png'),
        pdf: await readDocumentAsset(pdfPath, `/checklists/${slug}/checklist.pdf`),
    };
}
