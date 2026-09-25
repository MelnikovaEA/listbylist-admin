import type {ComponentPropsWithRef} from 'react';
import styles from './TableContainer.module.css';

export function TableContainer({className, ...props}: ComponentPropsWithRef<'div'>) {
    return <div className={[styles.container, className].filter(Boolean).join(' ')} {...props} />;
}
