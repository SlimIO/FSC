"use strict";

// Require Node.js Dependencies
const {
    createReadStream,
    promises: { readdir, stat, readFile }
} = require("fs");
const { join, parse } = require("path");
const { performance } = require("perf_hooks");

// Require Third-party Dependencies
const ssri = require("ssri");

/**
 * @version 0.1.0
 *
 * @async
 * @function entityAge
 * @description Return the age of a repository/file inside a parent repository
 * @param {!string} target location
 * @returns {Promise<number>}
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
 * @function filesNumber
 * @description Return the number of files inside a parent repository
 * @param {!string} target location
 * @returns {Promise<number>}
 */
async function filesNumber(target) {
    const st = await stat(target);
    let files = 0;
    if (st.isDirectory()) {
        const repo = await readdir(target);

        // TODO: refactor in async
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
 * @function repositoryNumber
 * @description Return the number of repository inside a parent repository
 * @param {!string} target location
 * @returns {Promise<number>}
 */
async function repositoryNumber(target) {
    const st = await stat(target);
    let repository = 0;

    if (st.isDirectory()) {
        const repo = await readdir(target);

        // TODO: refactor in async
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
 * @function recSize
 * @description Get size of a given directory recursively
 * @param {!string} location target
 * @returns {AsyncIterableIterator<number>}
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
            yield dc.size;
        }
    }
}

/**
 * @async
 * @function dirSize
 * @description Get size of a given directory recursively
 * @param {!string} location location
 * @returns {Promise<number>}
 */
async function dirSize(location = null) {
    const st = await stat(location);
    if (st.isFile()) {
        return st.size;
    }

    let sum = 0;
    for await (const size of recSize(location)) {
        sum += size;
    }

    return sum;
}

/**
 * @async
 * @function readTime
 * @param {!string} target location
 * @description Get the time of a given file in milliseconds
 * @returns {Promise<number>}
 */
async function readTime(target) {
    const start = performance.now();
    await readFile(target);

    return (performance.now() - start).toFixed(2);
}

/**
 * @async
 * @function spaceOfTarget
 * @description it is used to get the size of a file or folder in percent relative to the parent folder
 * @param {!string} target location
 * @returns {Promise<number>}
 */
async function spaceOfTarget(target) {
    const st = await stat(target);
    const { dir } = parse(target);
    const total = await dirSize(dir);

    if (st.isFile()) {
        return (st.size * 100 / total).toFixed(2);
    }
    const repSize = await dirSize(target);

    return (repSize * 100 / total).toFixed(2);
}

/**
 * @async
 * @function generateFileIntegrityHash
 * @description generate and return an integrity hash for a given file (target).
 * @param {!string} target location
 * @returns {Promise<string>}
 *
 * @throws {Error}
 */
async function generateFileIntegrityHash(target) {
    const st = await stat(target);
    if (!st.isFile()) {
        throw new Error("target must be a file");
    }

    return ssri.fromStream(createReadStream(target), {
        algorithms: ["sha512"]
    });
}

module.exports = {
    entityAge,
    filesNumber,
    repositoryNumber,
    recSize,
    dirSize,
    readTime,
    generateFileIntegrityHash,
    spaceOfTarget
};
