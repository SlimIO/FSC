// Require Slimio dependencies
const is = require("@slimio/is");

// Require Node.js Dependencies
const { stat } = require("fs").promises;

// Require Class FscTools
const { FscTools } = require("./utils");

/**
 * @class ConfigFsc
 *
 * @classdesc JSON Config loader for scanning repositories
 *
 * @author Irvin MONTES <irvin_montes@outlook.fr>
 * @version 0.1.0
 */
class ConfigFsc extends FscTools {
    /**
     * @version 0.1.0
     *
     * @constructor
     * @param {!String} profileTarget Absolute path to the configuration file
     * @param {!Object} profileRules  Rules of the configuration file
     */
    constructor(profileTarget, profileRules) {
        super(profileTarget, profileRules);
        if (!is.string(profileTarget)) {
            // eslint-disable-next-line
            throw new TypeError(`"Config.constructor->profileTarget should be typeof <string>, received type ${typeof profileTarget}"`);
        }
        if (!is.object(profileRules)) {
            console.log(profileRules);
            // eslint-disable-next-line
            throw new TypeError(`"Config.constructor->profileRules should be typeof <object>, received type ${typeof profileRules}"`);
        }
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
        const targetType = await stat(this.target);
        if (targetType.isFile()) {
            for (const rule of this.rules) {
                if (rule.value === null) {
                    continue;
                }
                if (rule.name === "space_of_file_to_repository") {
                    const counter = await this.spaceFileOfRep();
                    if (counter <= rule.value) {
                        continue;
                    }
                    if (rule.interval !== null && typeof rule.interval === "number") {
                        continue;
                    }
                    // eslint-disable-next-line
                    console.log(`"Error ce fichier fait ${counter}% du dossier, il ne devrait pas dépasser ${rule.value}%"`);
                    // new Alarm(`"Error ce dossier contient ${counter} dossier(s), il devrait n'en contenir que ${rule.value}"`, {
                    //     correlateKey: "file_limit_reached"
                    // });
                }
            }
        }
        if (targetType.isDirectory()) {
            for (const rule of this.rules) {
                if (rule.value === null) {
                    continue;
                }
                if (rule.name === "maximum_files") {
                    const counter = await this.maxFiles();
                    if (counter <= rule.value) {
                        continue;
                    }
                    if (rule.interval !== null && typeof rule.interval === "number") {
                        continue;
                    }
                    console.log(`"Error ce dossier contient ${counter} fichier(s), il devrait n'en contenir que ${rule.value}"`);
                    // new Alarm(`"Error ce dossier contient ${counter} fichier(s), il devrait n'en contenir que ${rule.value}"`, {
                    //     correlateKey: "file_limit_reached"
                    // });
                }
                if (rule.name === "maximum_repository") {
                    const counter = await this.maxRep();
                    if (counter <= rule.value) {
                        continue;
                    }
                    if (rule.interval !== null && typeof rule.interval === "number") {
                        continue;
                    }
                    console.log(`"Error ce dossier contient ${counter} dossier(s), il devrait n'en contenir que ${rule.value}"`);
                    // new Alarm(`"Error ce dossier contient ${counter} dossier(s), il devrait n'en contenir que ${rule.value}"`, {
                    //     correlateKey: "file_limit_reached"
                    // });
                }
                if (rule.name === "age_repository") {
                    const counter = await this.ageRep();
                    if (counter <= rule.value) {
                        continue;
                    }
                    if (rule.interval !== null && typeof rule.interval === "number") {
                        continue;
                    }
                    // eslint-disable-next-line
                    console.log(`"Error ce dossier est crée depuis ${counter}Ms, il devrait être supprimé après ${rule.value}Ms"`);
                    // new Alarm(`"Error ce dossier contient ${counter} dossier(s), il devrait n'en contenir que ${rule.value}"`, {
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
