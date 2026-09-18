import type {ButtonHTMLAttributes} from 'react';
import styles from './SubmitButton.module.css';

type SubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type'>;

export function SubmitButton(props: SubmitButtonProps) {
    return <button className={styles.button} type="submit" {...props} />;
}
