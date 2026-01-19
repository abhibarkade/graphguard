import crypto from 'crypto';

/**
 * Generate a checksum for schema content
 */
export const generateChecksum = (content: string): string => {
    return crypto.createHash('sha256').update(content).digest('hex');
};

/**
 * Validate variant ID format
 */
export const isValidVariantId = (id: string): boolean => {
    return /^[a-zA-Z0-9-_]+$/.test(id);
};

/**
 * Sleep utility for async operations
 */
export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
