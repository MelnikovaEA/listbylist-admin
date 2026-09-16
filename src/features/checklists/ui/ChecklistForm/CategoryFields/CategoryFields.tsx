import {useWatch, type UseFormReturn} from 'react-hook-form';
import type {CategoryOption} from '@/src/features/categories/model/categoryOption';
import type {
    ChecklistFormInput,
    ChecklistFormValues,
} from '../../../form/schema';
import {findCategoryOption} from '../../../model/categoryCombobox';
import {CategoryCombobox} from '../CategoryCombobox/CategoryCombobox';
import {FieldError} from '../FieldFeedback';
import styles from './CategoryFields.module.css';

type CategoryFormOperations = Pick<
    UseFormReturn<ChecklistFormInput, unknown, ChecklistFormValues>,
    'clearErrors' | 'control' | 'register' | 'setValue'
>;

type ChecklistCategoryFieldsProps = {
    categories: CategoryOption[];
    errors: {
        slug?: string;
        title?: string;
        description?: string;
    };
    form: CategoryFormOperations;
};

export function CategoryFields({
    categories,
    errors,
    form,
}: ChecklistCategoryFieldsProps) {
    const {clearErrors, control, register, setValue} = form;
    const categorySlug = useWatch({control, name: 'categorySlug'}) ?? '';
    const selectedCategory = findCategoryOption(categories, categorySlug);

    const handleCategoryInputChange = (nextSlug: string) => {
        const nextCategory = findCategoryOption(categories, nextSlug);

        if (nextCategory) {
            setValue('categoryTitle', nextCategory.title, {shouldDirty: true, shouldValidate: true});
            setValue('categoryDescription', nextCategory.description, {shouldDirty: true});
        } else if (selectedCategory) {
            setValue('categoryTitle', '', {shouldDirty: true, shouldValidate: true});
            setValue('categoryDescription', '', {shouldDirty: true});
        }
    };

    const selectCategory = (category: CategoryOption) => {
        setValue('categorySlug', category.slug, {shouldDirty: true, shouldValidate: true});
        setValue('categoryTitle', category.title, {shouldDirty: true, shouldValidate: true});
        setValue('categoryDescription', category.description, {shouldDirty: true});
        clearErrors(['categorySlug', 'categoryTitle', 'categoryDescription']);
    };

    return <div className={styles.categoryFields}>
        <div className={styles.gridTwo}>
            <div className={styles.field}>
                <label htmlFor="categorySlug">Категория: slug *</label>
                <CategoryCombobox
                    categories={categories}
                    error={errors.slug}
                    inputId="categorySlug"
                    registration={register('categorySlug')}
                    value={categorySlug}
                    onInputChange={handleCategoryInputChange}
                    onSelect={selectCategory}
                />
                <FieldError message={errors.slug} />
            </div>
            <label className={styles.field}><span>Категория: название *</span>
                <input
                    {...register('categoryTitle')}
                    readOnly={Boolean(selectedCategory)}
                    aria-invalid={Boolean(errors.title)}
                    placeholder="Сезонные"
                />
                <FieldError message={errors.title} />
            </label>
        </div>
        <label className={styles.field}><span>Описание категории</span>
            <input
                {...register('categoryDescription')}
                readOnly={Boolean(selectedCategory)}
                aria-invalid={Boolean(errors.description)}
                placeholder="Летние, зимние, праздничные и тематические чек-листы."
            />
            <FieldError message={errors.description} />
        </label>
        {selectedCategory && <p className={styles.existingCategoryNotice} role="status">
            Используется существующая категория «{selectedCategory.title}». Изменить её название и описание можно в разделе «Категории».
        </p>}
    </div>;
}
