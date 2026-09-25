import type {ComponentPropsWithoutRef} from 'react';
import styles from './Button.module.css';

export type ButtonAppearance = {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'default' | 'icon';
};

type ButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'className'> & ButtonAppearance;

export function Button({variant = 'primary', size = 'default', type = 'button', ...props}: ButtonProps) {
    return <button
        className={`${styles.button} ${styles[variant]} ${styles[size]}`}
        type={type}
        {...props}
    />;
}
