import { getContext } from 'svelte';
import { CONTEXT_KEY } from '@sapper/internal/shared';

export const stores = () => getContext(CONTEXT_KEY);

export { start, prefetch } from './app';
export * from './baseuri_helper.js'
export * from './types.js'
export { default as goto } from './goto/index';
export { default as prefetchRoutes } from './prefetchRoutes/index';
