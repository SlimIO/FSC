// Require Node.js Dependencies
const { stat } = require("fs").promises;

// Require Class FscTools
const { FscTools } = require("./utils");
const { regex } = require("../regex.js");
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
     * @public
     * @async
     * @method maxFiles
     * @desc Return the number of files inside a parent repository
     * @memberof ConfigFsc
     * @return {Number}
     */
    async checkRules() {
        for (const rule of this.rules) {
            if (rule.name === "how_many_patern_match") {
                const it = await this.how_many_patern_match(/* rule.repository.patern */regex);
                let match = 0;
                for await (const count of it) {
                    match += count;
                }
                if (match <= rule.value) {
                    continue;
                }
                console.log(`"Ce dossier contient ${match} fichier(s) correspondant au pattern indiquer"`);
                // new Alarm(`"Error ce dossier contient ${counter} fichier(s), il devrait n'en contenir que ${rule.value}"`, {
                //     correlateKey: "file_limit_reached"
                // });
            }
        }
    }
}


module.exports = {
    ConfigFsc
};
