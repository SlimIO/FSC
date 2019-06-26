// Require Slimio dependencies
const is = require("@slimio/is");
const Addon = require("@slimio/addon");
const alert = require("@slimio/alert");

// Require Node.js Dependencies
const { readdir, stat, readFile } = require("fs").promises;
const { parse, join } = require("path");

// Require third-party Dependencies
const { performance } = require("perf_hooks");
const { createHash } = require("crypto");

// Create addon FSC
const FSC = new Addon("FSC", {
    version: "0.1.0",
    verbose: true

}).lockOn("events");

// // Declare alarm
// const { Alarm } = alert(FSC);

/**
 * @class ConfigFsc
 *
 * @classdesc JSON Config loader for scanning repositories
 *
 * @property {String} target Path to the configuration file
 * @author Irvin MONTES <irvin_montes@outlook.fr>
 * @version 0.1.0
 */
class ConfigFsc {
    /**
     * @version 0.1.0
     *
     * @constructor
     * @param {!String} profileTarget Absolute path to the configuration file
     * @param {!Array} profileRules  Rules of the configuration file
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
     * @memberof ConfigFsc
     * @return {Number}
     */
    async checkRules() {
        const repo = await readdir(this.target);
        for (const rule of this.rules) {
            if (rule.value === null) {
                continue;
            }
            if (rule.name === "maximum_files") {
                let count = 0;
                for (const data of repo) {
                    const info = await stat(join(this.target, data));
                    if (info.isFile()) {
                        count += 1;
                    }
                }
                if (count > rule.value) {
                    if (rule.interval !== null && typeof rule.interval === "number") {
                        continue;
                    }
                    console.log(`"Error ce dossier contient ${count} fichier(s), il devrait n'en contenir que ${rule.value}"`);
                    // new Alarm(`"Error ce dossier contient ${count} fichier(s), il devrait n'en contenir que ${rule.value}"`, {
                    //     correlateKey: "file_limit_reached"
                    // });
                }
            }
            if (rule.name === "maximum_repository") {
                let count = 0;
                const repo = await readdir(this.target);
                for (const data of repo) {
                    const info = await stat(join(this.target, data));
                    if (info.isDirectory()) {
                        count += 1;
                    }
                }
                if (count > rule.value) {
                    if (rule.interval !== null && typeof rule.interval === "number") {
                        continue;
                    }
                    console.log(`"Error ce dossier contient ${count} dossier(s), il devrait n'en contenir que ${rule.value}"`);
                    // new Alarm(`"Error ce dossier contient ${count} dossier(s), il devrait n'en contenir que ${rule.value}"`, {
                    //     correlateKey: "file_limit_reached"
                    // });
                }
            }
        }
    }
}

module.exports = {
    ConfigFsc
};

