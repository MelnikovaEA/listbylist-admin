import Link from 'next/link';
import type {ComponentPropsWithoutRef} from 'react';
import type {ButtonAppearance} from './Button';
import styles from './Button.module.css';

type ButtonLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, 'className'> & ButtonAppearance;

export function ButtonLink({variant = 'primary', size = 'default', ...props}: ButtonLinkProps) {
    return <Link className={`${styles.button} ${styles[variant]} ${styles[size]}`} {...props} />;
}
