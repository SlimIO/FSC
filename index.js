// Require Node.js Dependencies
const { readFile, access } = require("fs").promises;
const { join } = require("path");

const { entityAge, filesNumber, repositoryNumber,
    dirSize, readTime, integrity, spaceOfTarget } = require("./src/utils");

// const checkRules = require("./src/utils");

// Require Slimio Dependencies
// const Addon = require("@slimio/addon");
// const alert = require("@slimio/alert");
// const metrics = require("@slimio/metrics");

// // Create addon FSC
// const FSC = new Addon("FSC", {
//     version: "0.1.0",
//     verbose: true

// }).lockOn("events");
// const { Entity } = metrics(FSC);
// const { Alarm } = alert(FSC);

// let intervalId;
// const MyEntity = new Entity("MyEntity", {
//     description: "Hello world!"
// });

/**
 * @version 0.1.0
 *
 * @async
 * @param {Array<String>} rules profile
 * @param {!String} target location
 * @param {!String} name profile
 * @desc Check the active rules of a profile and send an alarm when the rules are reached.
 * @return {Promise<void>}
 */
async function checkRules(rules, target, name) {
    for (const rule of rules) {
        switch (rule.name) {
            case "age_limiter":
                if (await entityAge(target) > rule.value) {
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "age_limiter_alarm",
                    //     entity: MyEntity
                    // });
                }
                break;
            case "files_number":
                if (await filesNumber(target, name) > rule.value) {
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "files_number_alarm",
                    //     entity: MyEntity
                    // });
                }
                break;
            case "repository_number":
                if (await repositoryNumber(target, name) > rule.value) {
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "files_number_alarm",
                    //     entity: MyEntity
                    // });
                }
                break;
            case "size_limiter":
                if (await dirSize(target) > rule.value) {
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "size_limiter_alarm",
                    //     entity: MyEntity
                    // });
                }
                break;
            case "space_limiter":
                if (await spaceOfTarget(target) > rule.value) {
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "size_limiter_alarm",
                    //     entity: MyEntity
                    // });
                }
                break;
            case "read_time":
                if (await readTime(target) > rule.value) {
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "read_time_alarm",
                    //     entity: MyEntity
                    // });
                }
                break;
            case "integrity":
                if (await integrity(target) > rule.value) {
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "integrity_alarm",
                    //     entity: MyEntity
                    // });
                }
                break;
        }
    }
}

// FSC.on("awake", () => {
//     FSC.ready();
async function main() {
    // Read config.json
    const json = await readFile(join(process.cwd(), "config.json"));
    // Parse config.json
    const { profiles } = JSON.parse(json);
    // Check all rules of all profiles
    for (const [profileName, profile] of Object.entries(profiles)) {
        const { target, interval, rules } = profile;
        if (!profile.active) {
            continue;
        }
        intervalId = setInterval(async() => {
            try {
                await access(target);
                await checkRules(rules, target, profileName);
            }
            catch (error) {
                console.log(error);
                // new Alarm(`${profileName} : ${profileName} doesn't exist !`, {
                //     correlateKey: "access_alarm",
                //     entity: MyEntity
                // });
            }
        }, interval);
    }
}
main().catch(console.error);
// });

// FSC.on("close", () => {
//     clearInterval(intervalId);
//     console.log("addon stopped");

// });

// module.exports = FSC;
