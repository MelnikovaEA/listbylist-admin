'use client';

import {useEffect, useState, type ChangeEvent} from 'react';
import {FieldError, FieldTooltip} from '../FieldFeedback/FieldFeedback';
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

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];
        const nextPreviewUrl = file ? URL.createObjectURL(file) : null;
        setSelectedPreviewUrl(nextPreviewUrl);
    };

    const handlePdfChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];
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
        <div className={styles.gridThree}>
            <label className={styles.fileField}>
                <span className={styles.labelText}>
                    checklist.png <FieldTooltip text="Оригинал из Canva. Из него автоматически создадутся preview.webp и view.webp." />
                </span>
                {/* Blob URLs from local file inputs cannot be optimized by next/image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {selectedPreviewUrl && <img
                    className={styles.filePreview}
                    src={selectedPreviewUrl}
                    alt="Предпросмотр нового изображения чек-листа"
                />}
                <input
                    className={selectedPreviewUrl ? styles.fileSelected : undefined}
                    name="image"
                    type="file"
                    accept=".png,image/png"
                    onChange={handleImageChange}
                    aria-invalid={Boolean(imageError)}
                />
                <FieldError message={imageError} />
            </label>
            <label className={styles.fileField}>
                <span className={styles.labelText}>
                    checklist.pdf <FieldTooltip text="PDF для печати." />
                </span>
                {selectedPdfPreviewUrl && <iframe
                    className={styles.pdfPreview}
                    src={`${selectedPdfPreviewUrl}#page=1&view=FitH`}
                    title="Предпросмотр PDF чек-листа"
                    loading="lazy"
                />}
                <input
                    className={selectedPdfPreviewUrl ? styles.fileSelected : undefined}
                    name="pdf"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfChange}
                    aria-invalid={Boolean(pdfError)}
                />
                <FieldError message={pdfError} />
            </label>
        </div>
    </section>;
}
