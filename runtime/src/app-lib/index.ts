import { getContext } from 'svelte';
import { CONTEXT_KEY } from '@sapper/internal/shared';

export function stores<Session = any>() {
  return getContext(CONTEXT_KEY)
}
export * from './baseuri_helper'
export * from './router/index';
export { default as goto } from './goto/index';
export * from './types.js';
