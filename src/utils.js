// Require Node.js Dependencies
const { readdir, stat, readFile } = require("fs").promises;
const { join } = require("path");
const path = require("path");

// Require third-party dependencies
const { performance } = require("perf_hooks");
const { createHash } = require("crypto");

/**
 * @version 0.1.0
 *
 * @async
 * @param {!String} target location
 * @desc Return the age of a repository/file inside a parent repository
 * @returns {Promise<Number>}
 */
async function entityAge(target) {
    const { birthtimeMs } = await stat(target);
    const date = Date.now();

    return Math.round(date - birthtimeMs);
}

/**
 * @version 0.1.0
 *
 * @async
 * @param {!String} target location
 * @param {!String} name of the actual profile
 * @desc Return the number of files inside a parent repository
 * @return {Promise<Number>}
 */
async function filesNumber(target, name) {
    const st = await stat(target);
    let files = 0;
    if (st.isFile()) {
        console.log(`Vous devez fournir un dossier comme path: ${name} rule : files_number`);
    }
    else if (st.isDirectory()) {
        const repo = await readdir(target);
        for (const file of repo) {
            const test = await stat(join(target, file));
            if (test.isFile()) {
                files += 1;
            }
        }
    }

    return files;
}

/**
 * @version 0.1.0
 *
 * @async
 * @method repositoryNumber
 * @param {!String} target location
 * @param {!String} name of the actual profile
 * @desc Return the number of repository inside a parent repository
 * @return {Promise<Number>}
 */
async function repositoryNumber(target, name) {
    const st = await stat(target);
    let repository = 0;
    if (st.isFile()) {
        console.log(`Vous devez fournir un dossier comme path: ${name} rule : repository_number`);
    }
    else if (st.isDirectory()) {
        const repo = await readdir(target);
        for (const file of repo) {
            const test = await stat(join(target, file));
            if (test.isDirectory()) {
                repository += 1;
            }
        }
    }

    return repository;
}

/**
* @async
* @generator
* @func recSize
* @param {!String} location target
* @desc Get size of a given directory recursively
* @returns {AsyncIterableIterator<Number>}
*/
async function* recSize(location = null) {
    const target = location === null ? target : location;
    const files = await readdir(location);
    const stats = await Promise.all(
        files.map((file) => stat(join(location, file)))
    );

    for (let id = 0; id < files.length; id++) {
        const dc = stats[id];
        if (dc.isDirectory()) {
            yield* recSize(join(location, files[id]));
        }
        else {
            yield [files[id], dc.size];
        }
    }
}

/**
 * @async
 * @func dirSize
 * @param {!String} location location
 * @desc Get size of a given directory recursively
 * @returns {Promise<Number>}
 */
async function dirSize(location = null) {
    const target = location === null ? target : location;
    const st = await stat(location);
    if (st.isFile()) {
        return st.size;
    }

    let sum = 0;
    for await (const [file, size] of recSize(location)) {
        sum += size;
    }

    return sum;
}

/**
 * @async
 * @func readTime
 * @param {!String} target location
 * @desc Get the time of a given file in milliseconds
 * @returns {Promise<Number>}
 */
async function readTime(target) {
    const st = await stat(target);
    if (!st.isFile()) {
        console.log("The target must be a path to a file");
    }
    const start = performance.now();
    await readFile(target);

    return (performance.now() - start).toFixed(2);
}

/**
 * @async
 * @func spaceOfTarget
 * @param {!String} target location
 * @desc it is used to get the size of a file or folder in percent relative to the parent folder
 * @returns {Promise<Number>}
 */
async function spaceOfTarget(target) {
    const st = await stat(target);
    let size = 0;
    if (st.isFile()) {
        size += st.size;
        const { dir } = path.parse(target);
        const total = await dirSize(dir);
        const result = size * 100 / total;

        return result.toFixed(2);
    }

    const repSize = await dirSize(target);
    const { dir } = path.parse(target);
    const total = await dirSize(dir);
    const result = repSize * 100 / total;

    return result.toFixed(2);
}

/**
 * @async
 * @func integrity
 * @param {!String} target location
 * @desc check the integrity of a file on an interval
 * @returns {Promise<String>}
 */
async function integrity(target) {
    const st = await stat(target);
    if (!st.isFile()) {
        console.log("vous devez mettre un file en path");
    }
    const str = await readFile(target, "utf-8");
    const shasum = createHash("sha1").update(str).digest("utf8");

    return shasum;
}

module.exports = {
    entityAge, filesNumber, repositoryNumber,
    recSize, dirSize, readTime, integrity, spaceOfTarget
};
