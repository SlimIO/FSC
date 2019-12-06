// Require Node.js Dependencies
import { promises as fs } from "fs";
import { join, dirname } from "path";
const { access, stat } = fs;

// Require Slimio Dependencies
import Addon from "@slimio/addon";
import alert from "@slimio/alert";
import metrics from "@slimio/metrics";
import profilesLoader from "@slimio/profiles";

// Require Third-party Dependencies
import { fileURLToPath } from "url";

// Node.js CJS CONSTANTS
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Require Internal Dependencies
import { entityAge, filesNumber, repositoryNumber,
    dirSize, readTime, spaceOfTarget } from "./src/utils.js";

let profiles;

// Create addon FSC
const FSC = new Addon("FSC", {
    version: "0.1.0",
    verbose: false
}).lockOn("events");
const { Entity } = metrics(FSC);
const { Alarm } = alert(FSC);

// Declare the root entity
const E_FS = new Entity("FileSystem", {
    description: "FileSystem root/parent entity"
});

/**
 * @version 0.1.0
 *
 * @async
 * @function checkRules
 * @description Check the active rules of a profile and send an alarm when the rules are reached.
 * @param {!string} name profile name
 * @param {!string} target target location (path or glob)
 * @param {Array<string>} rules watchers
 * @returns {Promise<void>}
 */
async function checkRules(name, target, rules) {
    const st = await stat(target);

    for (const rule of rules) {
        switch (rule.name) {
            case "age_limiter":
            {
                const it = await entityAge(target, name);
                if (it > rule.value) {
                    console.log(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`);
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "age_limiter_alarm",
                    //     entity: E_FS
                    // });
                }
                break;
            }
            case "files_number":
            {
                if (st.isFile()) {
                    console.log(`${name} : ${rule.name} | the target muste be a path to a repository`);
                    // new Alarm(`${name} : ${rule.name} target must be a path to a repository`, {
                    //     correlateKey: "files_number_alarm",
                    //     entity: E_FS
                    // });
                    break;
                }
                const it = await filesNumber(target, name);
                if (st.isDirectory() && it > rule.value) {
                    console.log(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`);
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "files_number_alarm",
                    //     entity: E_FS
                    // });
                }
                break;
            }
            case "repository_number":
            {
                if (st.isFile()) {
                    console.log(`${name} : ${rule.name} | the target muste be a path to a repository`);
                    // new Alarm(`${name} : ${rule.name} target must be a path to a repository`, {
                    //     correlateKey: "repository_number_alarm",
                    //     entity: E_FS
                    // });
                    break;
                }
                const it = await repositoryNumber(target, name);
                if (st.isDirectory() && it > rule.value) {
                    console.log(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`);
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "repository_number_alarm",
                    //     entity: E_FS
                    // });
                }
                break;
            }
            case "size_limiter":
            {
                const it = await dirSize(target);
                if (it > rule.value) {
                    console.log(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`);
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "size_limiter_alarm",
                    //     entity: E_FS
                    // });
                }
                break;
            }
            case "space_limiter":
            {
                const it = await spaceOfTarget(target);
                if (it > rule.value) {
                    console.log(`${name} : ${rule.name} | reached | ${it} per cent, expected => ${rule.value}`);
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "size_limiter_alarm",
                    //     entity: E_FS
                    // });
                }
                break;
            }
            case "read_time":
            {
                if (st.isDirectory()) {
                    console.log(`${name} : ${rule.name} | the target muste be a path to a file`);
                    // new Alarm(`${name} : ${rule.name} target must be a path to a repository`, {
                    //     correlateKey: "readtime_alarm",
                    //     entity: E_FS
                    // });
                    break;
                }
                const it = await readTime(target, name);
                if (st.isFile() && it > rule.value) {
                    console.log(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`);
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "readtime_alarm",
                    //     entity: E_FS
                    // });
                }
                break;
            }
        }
    }
}

FSC.on("awake", async() => {
    profiles = await profilesLoader(join(__dirname, "config.json"));
    profiles.events.on("walk", async(name, payload) => {
        try {
            const { target, rules = [] } = payload;
            // TODO: generate RawQos here
            await access(target);

            if (rules.length > 0) {
                await checkRules(name, target, rules);
            }
        }
        catch (err) {
            console.log(err);
        }
    });

    await FSC.ready();
});

FSC.on("sleep", async() => {
    await profiles.free();
});

export default FSC;
