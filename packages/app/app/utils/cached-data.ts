import type { AsyncDataOptions } from '#app';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const preserveCachedData: AsyncDataOptions<any>['getCachedData'] = (
  key,
  nuxtApp,
  ctx
) => {
  if (ctx.cause !== 'refresh:manual' && ctx.cause !== 'refresh:hook') {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
  }
};
