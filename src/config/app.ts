/**
 * Application configuration
 */
export const APP_CONFIG = {
    name: 'Gleaned',
    shortName: 'Gleaned',
    description: 'Clean Reading Experience',
    version: '1.0.0',
    cacheName: 'gleaned-v1',
    staticCacheName: 'gleaned-static-v1',
    dbName: 'GleanedDB'
} as const;

export type AppConfig = typeof APP_CONFIG;
