'use client';

import {useEffect, useState} from 'react';
import {FileField} from '@/src/components/FileField/FileField';
import styles from './FileFields.module.css';

type FileFieldsProps = {
    imageError?: string;
    initialPreviewUrl?: string | null;
    isEditing: boolean;
    onSelectionChange: (hasSelectedFiles: boolean) => void;
    pdfError?: string;
};

export function FileFields({
    imageError,
    initialPreviewUrl = null,
    isEditing,
    onSelectionChange,
    pdfError,
}: FileFieldsProps) {
    const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
    const [selectedPdfPreviewUrl, setSelectedPdfPreviewUrl] = useState<string | null>(null);

    useEffect(() => () => {
        if (selectedPreviewUrl) {
            URL.revokeObjectURL(selectedPreviewUrl);
        }
    }, [selectedPreviewUrl]);

    useEffect(() => () => {
        if (selectedPdfPreviewUrl) {
            URL.revokeObjectURL(selectedPdfPreviewUrl);
        }
    }, [selectedPdfPreviewUrl]);

    useEffect(() => {
        onSelectionChange(Boolean(selectedPreviewUrl || selectedPdfPreviewUrl));
    }, [onSelectionChange, selectedPdfPreviewUrl, selectedPreviewUrl]);

    const handleImageChange = (file: File | null) => {
        const nextPreviewUrl = file ? URL.createObjectURL(file) : null;
        setSelectedPreviewUrl(nextPreviewUrl);
    };

    const handlePdfChange = (file: File | null) => {
        const nextPdfPreviewUrl = file ? URL.createObjectURL(file) : null;
        setSelectedPdfPreviewUrl(nextPdfPreviewUrl);
    };

    return <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Файлы</h2>
        {initialPreviewUrl && <div className={styles.currentPreview}>
            <span>Текущий preview</span>
            {/* The stored asset is already an optimized WebP served directly from S3. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                className={styles.filePreview}
                src={initialPreviewUrl}
                alt="Текущий preview чек-листа"
            />
        </div>}
        {isEditing && !initialPreviewUrl &&
            <p className={styles.previewUnavailable}>Текущий preview недоступен</p>}
        <div className={styles.gridTwo}>
            <FileField
                name="image"
                label="checklist.png"
                accept=".png,image/png"
                hint="Оригинал из Canva. Из него автоматически создадутся preview.webp и view.webp."
                error={imageError}
                hasSelectedFile={Boolean(selectedPreviewUrl)}
                onFileChange={handleImageChange}
            >
                {/* Blob URLs from local file inputs cannot be optimized by next/image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {selectedPreviewUrl && <img
                    className={styles.filePreview}
                    src={selectedPreviewUrl}
                    alt="Предпросмотр нового изображения чек-листа"
                />}
            </FileField>
            <FileField
                name="pdf"
                label="checklist.pdf"
                accept=".pdf,application/pdf"
                hint="PDF для печати."
                error={pdfError}
                hasSelectedFile={Boolean(selectedPdfPreviewUrl)}
                onFileChange={handlePdfChange}
            >
                {selectedPdfPreviewUrl && <iframe
                    className={styles.pdfPreview}
                    src={`${selectedPdfPreviewUrl}#page=1&view=FitH`}
                    title="Предпросмотр PDF чек-листа"
                    loading="lazy"
                />}
            </FileField>
        </div>
    </section>;
}
