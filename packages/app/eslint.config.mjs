// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';

export default withNuxt(skipFormatting)
   .overrideRules({
      // ...Override rules, for example:
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'vue/require-default-prop': 'off',
      'vue/valid-v-slot': ['error', { allowModifiers: true }],
   })
   .append({
      ignores: ['./sanity/types.ts'],
   })
   .append({
      files: ['./app/components/sanity/serializers/**/*.{vue,ts,js,cjs,mjs,mts,cts,jsx,tsx}'],
      rules: {
         'vue/prop-name-casing': 'off',
      },
   });
