/* CloudStatus runtime configuration */
export const CONFIG = Object.freeze({
    version: "100.0.0",
    expectedServiceCount: 24,

    refreshInterval: 5 * 60 * 1000,
    cacheKey: "cloudstatus-cache-v100",
    cacheMaxAge: 15 * 60 * 1000,
    staleCacheMaxAge: 24 * 60 * 60 * 1000,
    foregroundRefreshThreshold: 2 * 60 * 1000,

    fetchTimeout: 6500,
    readerTimeout: 7500,
    fallbackConcurrency: 4,

    desktopMasonryMinWidth: 760,
    desktopMaxWidth: 1180,
    masonryGap: 14
    });
