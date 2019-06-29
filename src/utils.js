// Require Slimio dependencies
const is = require("@slimio/is");

// Require Node.js Dependencies
const { readdir, stat } = require("fs").promises;
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
     * @version 0.1.0
     *
     * @public
     * @async
     * @method maxFiles
     * @desc Return the number of files inside a parent repository
     * @memberof FscTools
     * @return {Number}
     */
    async maxFiles() {
        const repo = await readdir(this.target);
        let count = 0;
        for (const data of repo) {
            const info = await stat(join(this.target, data));
            if (!info.isFile()) {
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
