// @ts-check
import { execSync } from 'child_process';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '../..');

function getStagedAndScopedFiles() {
    return execSync('git diff --staged --name-only --diff-filter=AM .')
        .toString()
        .split('\n')
        .filter(file => file.trim().length > 0)
        .map(file => file.replaceAll(' ', '\\ '))
        .map(file => resolve(ROOT, file));
}

/**
 * @param {string[]} files
 * @returns
 */
function stageFiles(files) {
    return execSync(`git add ${files.join(' ')}`, { stdio: 'inherit' });
}

/**
 *
 * @param {(files: string) => void} commandCallback
 */
function transformStagedFiles(commandCallback) {
    const files = getStagedAndScopedFiles();

    if (files.length > 0) {
        commandCallback(files.join(' '));
        stageFiles(files);
    }
}

export default transformStagedFiles;
