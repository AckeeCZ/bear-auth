/* eslint-disable no-undef */
// @ts-check
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import createStaged from '@tooling/staged';

/**
 * @param {string} args
 */
function format(args) {
    const prettierBinPath = resolve(import.meta.dirname, '../../../node_modules/.bin/prettier');
    const gitignore = resolve(import.meta.dirname, '../../../.gitignore');

    if (!args.includes('--write')) {
        args += ' --write ./**/*';
    }

    console.log('Formatting files with Prettier:');

    execSync(
        `${prettierBinPath} --ignore-path ${gitignore} --ignore-unknown --log-level=log --cache --cache-strategy=content --cache-location=.cache/prettier ${args}`,
        {
            encoding: 'utf8',
            stdio: 'inherit',
        },
    );

    console.log('\n');
}

let args = process.argv.slice(2).join(' ');

if (args.includes('--staged')) {
    createStaged(stagedFiles => {
        args = args.replace('--staged', ` --write ${stagedFiles}`);

        format(args);
    });
} else {
    format(args);
}
