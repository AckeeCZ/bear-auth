// @ts-check
import sortPlugin from '@ianvs/prettier-plugin-sort-imports';

import { generateImportOrder } from './utils/index.mjs';

/**
 * @type {import('@ianvs/prettier-plugin-sort-imports').PrettierConfig}
 */
const config = {
    singleQuote: true,
    jsxSingleQuote: true,
    semi: true,
    arrowParens: 'avoid',
    printWidth: 120,
    tabWidth: 4,
    trailingComma: 'all',

    plugins: [sortPlugin],
    importOrder: generateImportOrder([
        [
            '^(react/(.*)$)|^(react$)|^(react-native(.*)$)',
            '^(next/(.*)$)|^(next$)',
            '<BUILTIN_MODULES>',
            '<THIRD_PARTY_MODULES>',
        ],
        ['^@workspace/(.*)$'],
        ['^~(.*)$'],
        ['^[../]', '^[./]'],
    ]),

    /**
     * >=5.x
     */
    importOrderTypeScriptVersion: '5.0.0',

    overrides: [
        {
            files: ['*.json', '*.jsonc'],
            options: {
                trailingComma: 'none',
            },
        },
    ],
};

export default config;
