import 'server-only';

import {
    DeleteObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';

export const ASSET_CACHE_CONTROL = 'public, max-age=2592000, immutable';

export type ObjectContentDisposition =
    | 'inline'
    | `attachment; filename="${string}"`;

export type UploadObjectInput = {
    key: string;
    body: Buffer;
    contentType: string;
    contentDisposition: ObjectContentDisposition;
    cacheControl?: string;
};

type ObjectStorageConfig = {
    bucket: string;
    publicBaseUrl: string;
};

let client: S3Client | undefined;
let config: ObjectStorageConfig | undefined;

function getRequiredEnvironmentVariable(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`Не заполнена переменная окружения ${name}.`);
    }

    return value;
}

function getObjectStorageConfig(): ObjectStorageConfig {
    if (!config) {
        config = {
            bucket: getRequiredEnvironmentVariable('S3_BUCKET'),
            publicBaseUrl: getRequiredEnvironmentVariable('ASSET_BASE_URL').replace(/\/+$/, ''),
        };
    }

    return config;
}

function getObjectStorageClient(): S3Client {
    if (!client) {
        client = new S3Client({
            endpoint: getRequiredEnvironmentVariable('S3_ENDPOINT'),
            region: getRequiredEnvironmentVariable('S3_REGION'),
            forcePathStyle: true,
            credentials: {
                accessKeyId: getRequiredEnvironmentVariable('S3_ACCESS_KEY_ID'),
                secretAccessKey: getRequiredEnvironmentVariable('S3_SECRET_ACCESS_KEY'),
            },
        });
    }

    return client;
}

export function getPublicAssetUrl(key: string): string {
    const { publicBaseUrl } = getObjectStorageConfig();
    const normalizedKey = key.replace(/^\/+/, '');

    return `${publicBaseUrl}/${normalizedKey}`;
}

export async function uploadObject({
    key,
    body,
    contentType,
    contentDisposition,
    cacheControl = ASSET_CACHE_CONTROL,
}: UploadObjectInput): Promise<void> {
    const { bucket } = getObjectStorageConfig();

    await getObjectStorageClient().send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
            CacheControl: cacheControl,
            ContentDisposition: contentDisposition,
        }),
    );
}

export async function objectExists(key: string): Promise<boolean> {
    const { bucket } = getObjectStorageConfig();

    try {
        await getObjectStorageClient().send(
            new HeadObjectCommand({ Bucket: bucket, Key: key }),
        );
        return true;
    } catch (error: unknown) {
        if (
            typeof error === 'object' &&
            error !== null &&
            '$metadata' in error &&
            error.$metadata &&
            typeof error.$metadata === 'object' &&
            'httpStatusCode' in error.$metadata &&
            error.$metadata.httpStatusCode === 404
        ) {
            return false;
        }

        throw error;
    }
}

export async function deleteObject(key: string): Promise<void> {
    const { bucket } = getObjectStorageConfig();

    await getObjectStorageClient().send(
        new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
}
