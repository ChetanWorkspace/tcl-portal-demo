import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'dist/**',
    '.vercel/**',
    'next-env.d.ts',
  ]),
  // Last: disables conflicting ESLint formatting rules and enables prettier/prettier
  eslintPluginPrettierRecommended,
]);

export default eslintConfig;
