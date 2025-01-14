import { createFetch } from '@better-fetch/fetch';

export const $fetch = createFetch({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    timeout: 300 * 1000,
});
