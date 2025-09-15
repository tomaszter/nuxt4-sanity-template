import defineConfig from '@nuxtjs/tailwindcss/config';
import { screens } from './config/breakpoints';

export default defineConfig({
  content: [],
  theme: {
    colors: {},
    screens,
    extend: {
      fontFamily: {},
      transitionTimingFunction: {
        'in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'in-out-expo': 'cubic-bezier(1, 0, 0, 1)',
      },
    },
  },
});
