import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { ignores: ['dist/**'] },
  {
    files: ['**/*.ts'],
    // "prettier" goes last: it turns off the style rules that Prettier handles.
    extends: [js.configs.recommended, tseslint.configs.recommended, prettier],
    rules: {
      // Unused function arguments are fine when they start with "_" (Express needs all four
      // parameters on an error handler, for example).
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]);
