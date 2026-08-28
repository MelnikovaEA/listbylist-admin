import { randomUUID } from 'node:crypto';
import { loadEnvConfig } from '@next/env';
import {
    DeleteObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';

loadEnvConfig(process.cwd());

const requiredEnvironmentVariables = [
    'S3_ENDPOINT',
    'S3_REGION',
    'S3_BUCKET',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
    'ASSET_BASE_URL',
];

const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
    (name) => !process.env[name]?.trim(),
);

if (missingEnvironmentVariables.length > 0) {
    throw new Error(
        `Не заполнены переменные окружения: ${missingEnvironmentVariables.join(', ')}`,
    );
}

function getRequiredEnvironmentVariable(name: string): string {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`Не заполнена переменная окружения: ${name}`);
    }

    return value;
}

async function main() {
    const bucket = getRequiredEnvironmentVariable('S3_BUCKET');
    const testKey = `_system-tests/connection-${randomUUID()}.txt`;
    const testBody = Buffer.from('listbylist S3 connection test', 'utf8');
    let objectWasUploaded = false;

    const client = new S3Client({
        endpoint: getRequiredEnvironmentVariable('S3_ENDPOINT'),
        region: getRequiredEnvironmentVariable('S3_REGION'),
        forcePathStyle: true,
        credentials: {
            accessKeyId: getRequiredEnvironmentVariable('S3_ACCESS_KEY_ID'),
            secretAccessKey: getRequiredEnvironmentVariable('S3_SECRET_ACCESS_KEY'),
        },
    });

    try {
    console.log('1/3 Загрузка тестового объекта...');
    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: testKey,
            Body: testBody,
            ContentType: 'text/plain; charset=utf-8',
            CacheControl: 'no-store',
        }),
    );
    objectWasUploaded = true;

    console.log('2/3 Проверка метаданных объекта...');
    const metadata = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: testKey }),
    );

    if (metadata.ContentLength !== testBody.length) {
        throw new Error('Размер загруженного объекта не совпадает с ожидаемым.');
    }

    console.log('3/3 Удаление тестового объекта...');
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));
    objectWasUploaded = false;

    console.log('S3-проверка успешно завершена: загрузка, чтение метаданных и удаление работают.');
    } finally {
        if (objectWasUploaded) {
            console.log('Очистка тестового объекта после ошибки...');
            await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));
        }

        client.destroy();
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
