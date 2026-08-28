import { randomUUID } from 'node:crypto';
import { loadEnvConfig } from '@next/env';
import {
    deleteObject,
    objectExists,
    uploadObject,
} from '../src/lib/storage/objectStorage';

loadEnvConfig(process.cwd());

async function main() {
    const testKey = `_system-tests/connection-${randomUUID()}.txt`;
    const testBody = Buffer.from('listbylist S3 connection test', 'utf8');
    let objectWasUploaded = false;

    try {
        console.log('1/3 Загрузка тестового объекта...');
        await uploadObject({
            key: testKey,
            body: testBody,
            contentType: 'text/plain; charset=utf-8',
            contentDisposition: 'inline',
            cacheControl: 'no-store',
        });
        objectWasUploaded = true;

        console.log('2/3 Проверка наличия объекта...');
        if (!(await objectExists(testKey))) {
            throw new Error('Загруженный объект не найден.');
        }

        console.log('3/3 Удаление тестового объекта...');
        await deleteObject(testKey);
        objectWasUploaded = false;

        console.log('S3-проверка успешно завершена: загрузка, проверка и удаление работают.');
    } finally {
        if (objectWasUploaded) {
            console.log('Очистка тестового объекта после ошибки...');
            await deleteObject(testKey);
        }
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
