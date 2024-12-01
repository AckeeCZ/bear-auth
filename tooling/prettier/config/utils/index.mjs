// @ts-check
/**
 * @param {string[][]} groups
 */
export const generateImportOrder = groups => {
    const result = [];
    const groupBreak = '';

    for (const group of groups) {
        result.push(...group, groupBreak);
    }

    return result;
};
