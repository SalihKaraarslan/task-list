// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  // "prettier" goes last: it turns off the style rules that Prettier handles.
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
]);
