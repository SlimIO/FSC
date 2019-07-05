/* eslint-disable camelcase */
/* eslint-disable require-jsdoc */
// Require Slimio dependencies
const is = require("@slimio/is");

// Require Node.js Dependencies
const { readdir, stat, readFile } = require("fs").promises;
const { join } = require("path");
const path = require("path");

/**
 * @class FscTools
 *
 * @classdesc class use to give the tools to the config loader to monitor a file or a folder
 * @property {String} target Path to the configuration file
 * @property {Object} rules rules of the configuration file
 * @version 0.1.0
 */
class FscTools {
    /**
     * @version 0.1.0
     *
     * @constructor
     * @param {!String} profileTarget Absolute path to the configuration file
     * @param {!Object} profileRules  Rules of the configuration file
     */
    constructor(profileTarget, profileRules) {
        if (!is.string(profileTarget)) {
            // eslint-disable-next-line
            throw new TypeError(`"Config.constructor->profileTarget should be typeof <string>, received type ${typeof profileTarget}"`);
        }
        if (!is.object(profileRules)) {
            console.log(profileRules);
            // eslint-disable-next-line
            throw new TypeError(`"Config.constructor->profileRules should be typeof <object>, received type ${typeof profileRules}"`);
        }
        this.target = profileTarget;
        this.rules = profileRules;
    }

    /**
     * @async
     * @method how_many_patern_match
     * @param {String=} pattern pattern
     * @param {String=} location location
     * @returns {AsyncIterableIterator<Number>}
     */
    async* how_many_patern_match(pattern = null, location = null) {
        const target = location === null ? this.target : location;

        const st = await stat(target);
        if (!st.isDirectory()) {
            throw new Error("target must be a path to a directory");
        }
        else if (pattern !== null && Object.prototype.toString.call(pattern).slice(8, -1) !== "RegExp") {
            throw new TypeError("pattern must be a RegExp or a null value");
        }

        const repo = await readdir(target);
        let counter = 0;
        const stats = await Promise.all(
            repo.map((file) => stat(join(target, file)))
        );

        for (let index = 0; index < repo.length; index++) {
            const dc = stats[index];
            if (dc.isDirectory()) {
                yield* this.how_many_patern_match(pattern, join(target, repo[index]));
            }
            else if (dc.isFile()) {
                const readedFile = await readFile(join(target, repo[index]));
                if (pattern.test(readedFile.toString())) {
                    counter += 1;
                }
            }
        }

        yield counter;
    }

    /**
     * @version 0.1.0
     *
     * @public
     * @async
     * @method maxRep
     * @desc Return the number of repository inside a parent repository
     * @memberof FscTools
     * @return {Number}
     */
    async maxRep() {
        const repo = await readdir(this.target);
        let count = 0;
        for (const data of repo) {
            const info = await stat(join(this.target, data));
            if (!info.isDirectory()) {
                continue;
            }
            count += 1;
        }

        return count;
    }

    /**
     * @version 0.1.0
     *
     * @public
     * @async
     * @method ageRep
     * @desc Return the age of a repository
     * @memberof FscTools
     * @return {Number}
     */
    async ageRep() {
        const repo = await stat(this.target);
        const repAge = repo.birthtimeMs;
        const date = Date.now();

        return date - repAge;
    }

    /**
     * @version 0.1.0
     *
     * @public
     * @async
     * @method spaceFileOfRep
     * @desc Returns the use space of a file relative to its parent directory
     * @memberof FscTools
     * @return {Number}
     */
    async spaceFileOfRep() {
        // Constants
        const repotarget = path.parse(this.target);
        console.log(repotarget);
        const targetBaseName = repotarget.base;
        const parentTarget = repotarget.dir;
        const repo = await readdir(parentTarget);

        // initialize counter
        let totalSize = 0;
        let targetSize = 0;
        for (const element of repo) {
            const elementParsed = path.parse(element);
            const targetJuncture = join(parentTarget, elementParsed.base);
            const stats = await stat(targetJuncture);
            if (stats.isDirectory()) {
                continue;
            }
            if (elementParsed.base === targetBaseName) {
                targetSize += stats.size;
                totalSize += stats.size;
                continue;
            }
            totalSize += stats.size;
        }

        return Math.round(targetSize * 100 / totalSize);
    }
}

module.exports = {
    FscTools
};
