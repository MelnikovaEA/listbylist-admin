export function isUploadedFile(value: FormDataEntryValue | null): value is File {
    return value instanceof File && value.size > 0;
}
