"use strict";

require("make-promises-safe");

// Require Node.js Dependencies
const { readdir, stat, readFile } = require("fs").promises;
const { createReadStream } = require("fs");
const { join } = require("path");
const path = require("path");
const { finished } = require("stream");

// Require third-party dependencies
const { performance } = require("perf_hooks");
const { createHash } = require("crypto");


/**
 * @version 0.1.0
 *
 * @async
 * @param {!ReadbleStream} stream is a ReadbleStream
 * @description wait the end of a ReadbleStream and permit to throw eventual stream error
 * @returns {Promise<number>}
 */
async function run(stream) {
    await finished(stream, (err) => {
        if (err) {
            console.error("Stream failed.", err);
        }
        else {
            console.log("Stream is done reading.");
        }
    });
}

/**
 * @version 0.1.0
 *
 * @async
 * @param {!string} target location
 * @description Return the age of a repository/file inside a parent repository
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
 * @param {!string} target location
 * @param {!string} name of the actual profile
 * @description Return the number of files inside a parent repository
 * @returns {Promise<number>}
 */
async function filesNumber(target, name) {
    const st = await stat(target);
    let files = 0;
    if (st.isDirectory()) {
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
 * @function repositoryNumber
 * @param {!string} target location
 * @param {!string} name of the actual profile
 * @description Return the number of repository inside a parent repository
 * @returns {Promise<number>}
 */
async function repositoryNumber(target, name) {
    const st = await stat(target);
    let repository = 0;
    if (st.isDirectory()) {
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
 * @function recSize
 * @param {!string} location target
 * @description Get size of a given directory recursively
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
            yield [files[id], dc.size];
        }
    }
}

/**
 * @async
 * @function dirSize
 * @param {!string} location location
 * @description Get size of a given directory recursively
 * @returns {Promise<number>}
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
 * @function readTime
 * @param {!string} target location
 * @description Get the time of a given file in milliseconds
 * @returns {Promise<number>}
 */
async function readTime(target) {
    const st = await stat(target);
    if (st.size < 64000) {
        const start = performance.now();
        await readFile(target);

        return (performance.now() - start).toFixed(2);
    }
    const stream = createReadStream(target, { highWaterMark: 64000 });
    const start = performance.now();
    run(stream).catch(console.error);

    return (performance.now() - start).toFixed(2);
}

/**
 * @async
 * @function spaceOfTarget
 * @param {!string} target location
 * @description it is used to get the size of a file or folder in percent relative to the parent folder
 * @returns {Promise<number>}
 */
async function spaceOfTarget(target) {
    const st = await stat(target);
    let size = 0;
    if (st.isFile()) {
        size += st.size;
        const { dir } = path.parse(target);
        const total = await dirSize(dir);

        return (size * 100 / total).toFixed(2);
    }

    const repSize = await dirSize(target);
    const { dir } = path.parse(target);
    const total = await dirSize(dir);

    return (repSize * 100 / total).toFixed(2);
}

/**
 * @async
 * @function integrity
 * @param {!string} target location
 * @description return the integrity of a file
 * @returns {Promise<string>}
 */
async function integrity(target) {
    const st = await stat(target);
    if (st.isFile()) {
        if (st.size < 64000) {
            const str = await readFile(target, "utf-8");

            return createHash("sha1").update(str).digest("utf8");
        }
        const integrity = await new Promise((resolve, reject) => {
            const stream = createReadStream(target, { highWaterMark: 64000 });
            let data = "";
            stream.on("data", (chunk) => {
                data += chunk;
            });
            stream.on("end", () => {
                resolve(createHash("sha1").update(data).digest("utf8"));
            });
        });

        return integrity;
    }

    return console.log("vous devez fournir un fichier en target");
}

module.exports = {
    entityAge, filesNumber, repositoryNumber,
    recSize, dirSize, readTime, integrity, spaceOfTarget
};
