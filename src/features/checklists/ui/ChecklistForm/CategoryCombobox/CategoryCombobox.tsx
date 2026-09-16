import {useId, useMemo, useState, type ChangeEvent, type KeyboardEvent} from 'react';
import type {UseFormRegisterReturn} from 'react-hook-form';
import type {CategoryOption} from '@/src/features/categories/model/categoryOption';
import {normalizeSlug} from '../../../model/slug';
import {filterCategoryOptions} from '../../../model/categoryCombobox';
import styles from './CategoryCombobox.module.css';

type CategoryComboboxProps = {
    categories: ReadonlyArray<CategoryOption>;
    error?: string;
    inputId: string;
    registration: UseFormRegisterReturn<'categorySlug'>;
    value: string;
    onInputChange: (value: string) => void;
    onSelect: (category: CategoryOption) => void;
};

export function CategoryCombobox({
    categories,
    error,
    inputId,
    registration,
    value,
    onInputChange,
    onSelect,
}: CategoryComboboxProps) {
    const listboxId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const filteredCategories = useMemo(
        () => filterCategoryOptions(categories, value),
        [categories, value],
    );
    const activeCategory = filteredCategories[activeIndex];

    const openList = () => {
        setActiveIndex(0);
        setIsOpen(true);
    };

    const selectCategory = (category: CategoryOption) => {
        onSelect(category);
        setIsOpen(false);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        registration.onChange(event);
        onInputChange(event.target.value);
        setActiveIndex(0);
        setIsOpen(true);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setIsOpen(true);
            if (filteredCategories.length > 0) {
                setActiveIndex((index) =>
                    isOpen
                        ? Math.min(index + 1, filteredCategories.length - 1)
                        : 0
                );
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === 'Enter' && isOpen && activeCategory) {
            event.preventDefault();
            selectCategory(activeCategory);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            setIsOpen(false);
        }
    };

    return <div
        className={styles.combobox}
        onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsOpen(false);
            }
        }}
    >
        <input
            {...registration}
            id={inputId}
            role="combobox"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={isOpen}
            aria-activedescendant={isOpen && activeCategory
                ? `${listboxId}-${activeCategory.id}`
                : undefined}
            aria-invalid={Boolean(error)}
            autoComplete="off"
            placeholder="seasonal"
            value={value}
            onChange={handleChange}
            onClick={openList}
            onFocus={openList}
            onKeyDown={handleKeyDown}
        />
        {isOpen && <ul className={styles.comboboxList} id={listboxId} role="listbox">
            {filteredCategories.length > 0
                ? filteredCategories.map((category, index) => <li
                    className={index === activeIndex ? styles.comboboxOptionActive : undefined}
                    id={`${listboxId}-${category.id}`}
                    key={category.id}
                    role="option"
                    aria-selected={category.slug === normalizeSlug(value)}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectCategory(category)}
                >
                    <strong>{category.slug}</strong>
                    <span>{category.title}</span>
                </li>)
                : <li className={styles.comboboxEmpty}>Совпадений нет — будет создана новая категория.</li>}
        </ul>}
    </div>;
}
