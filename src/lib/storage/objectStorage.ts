import 'server-only';

import {
    DeleteObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
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

type ObjectStoragePrefixOperations = {
    listPage: (
        prefix: string,
        continuationToken?: string,
    ) => Promise<{
        keys: string[];
        nextContinuationToken?: string;
    }>;
    remove: (key: string) => Promise<void>;
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

async function listObjectPage(
    prefix: string,
    continuationToken?: string,
): Promise<{keys: string[]; nextContinuationToken?: string}> {
    const {bucket} = getObjectStorageConfig();
    const result = await getObjectStorageClient().send(
        new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
        }),
    );

    if (result.IsTruncated && !result.NextContinuationToken) {
        throw new Error('S3 вернул неполную страницу объектов без continuation token.');
    }

    return {
        keys: result.Contents?.flatMap((object) => object.Key ? [object.Key] : []) ?? [],
        nextContinuationToken: result.IsTruncated
            ? result.NextContinuationToken
            : undefined,
    };
}

const defaultPrefixOperations: ObjectStoragePrefixOperations = {
    listPage: listObjectPage,
    remove: deleteObject,
};

export async function deleteObjectsByPrefix(
    prefix: string,
    operations: ObjectStoragePrefixOperations = defaultPrefixOperations,
): Promise<void> {
    const prefixSegments = prefix.split('/').filter(Boolean);

    if (
        prefix.startsWith('/') ||
        !prefix.endsWith('/') ||
        prefixSegments.length < 2 ||
        prefixSegments.some((segment) => segment === '.' || segment === '..')
    ) {
        throw new Error('Некорректный prefix для удаления объектов из S3.');
    }

    const deleteErrors: unknown[] = [];
    let continuationToken: string | undefined;

    do {
        const page = await operations.listPage(prefix, continuationToken);

        if (page.keys.some((key) => !key.startsWith(prefix))) {
            throw new Error('S3 вернул объект за пределами удаляемого prefix.');
        }

        const deleteResults = await Promise.allSettled(
            page.keys.map((key) => operations.remove(key)),
        );

        deleteErrors.push(...deleteResults.flatMap((result) =>
            result.status === 'rejected' ? [result.reason] : [],
        ));
        continuationToken = page.nextContinuationToken;
    } while (continuationToken);

    if (deleteErrors.length > 0) {
        throw new AggregateError(
            deleteErrors,
            `Не удалось удалить все объекты S3 по prefix ${prefix}.`,
        );
    }
}
