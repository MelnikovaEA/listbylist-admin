import {z} from 'zod';

export function requiredString(message: string) {
    return z.string().trim().min(1, message);
}
