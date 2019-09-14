"use strict";

// Require Node.js Dependencies
const { access, stat } = require("fs").promises;
const { join } = require("path");

const { entityAge, filesNumber, repositoryNumber,
    dirSize, readTime, integ, spaceOfTarget } = require("./src/utils");

// Require Slimio Dependencies
const Config = require("@slimio/config");
const Addon = require("@slimio/addon");
const alert = require("@slimio/alert");
const metrics = require("@slimio/metrics");
const Scheduler = require("@slimio/scheduler");
const profilesLoader = require("@slimio/profiles");

let profiles;
let intervalSet;
// Create addon FSC
const FSC = new Addon("FSC", {
    version: "0.1.0",
    verbose: false
}).lockOn("events");
const { Entity } = metrics(FSC);
// const { Alarm } = alert(FSC);

// Déclare entities and MIC
// const MyEntity = new Entity("MyEntity", {
//     description: "Central metricsing"
// });


/**
 * @version 0.1.0
 *
 * @async
 * @param {Array<string>} rules profile
 * @param {!string} target location
 * @param {!string} name profile
 * @param {!boolean} metrics profile
 * @description Check the active rules of a profile and send an alarm when the rules are reached.
 * @returns {Promise<void>}
 */
// eslint-disable-next-line
async function checkRules(rules, target, name, metrics) {
    for (const rule of rules) {
        const st = await stat(target);
        switch (rule.name) {
            case "age_limiter":
            {
                const it = await entityAge(target, name);
                if (it > rule.value) {
                    console.log(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`);
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "age_limiter_alarm",
                    //     entity: MyEntity
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
                    //     entity: MyEntity
                    // });
                    break;
                }
                const it = await filesNumber(target, name);
                if (st.isDirectory() && it > rule.value) {
                    console.log(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`);
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "files_number_alarm",
                    //     entity: MyEntity
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
                    //     entity: MyEntity
                    // });
                    break;
                }
                const it = await repositoryNumber(target, name);
                if (st.isDirectory() && it > rule.value) {
                    console.log(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`);
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "repository_number_alarm",
                    //     entity: MyEntity
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
                    //     entity: MyEntity
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
                    //     entity: MyEntity
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
                    //     entity: MyEntity
                    // });
                    break;
                }
                const it = await readTime(target, name);
                if (st.isFile() && it > rule.value) {
                    console.log(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`);
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "readtime_alarm",
                    //     entity: MyEntity
                    // });
                }
                break;
            }
        }
    }
}

FSC.on("awake", async() => {
    try {
        profiles = await profilesLoader(join(__dirname, "config.json"));
    }
    catch (err) {
        console.log(err);
    }
    let isStarted = false;
    profiles.events.on("walk", async(name, payload) => {
        const { rules, target, metrics, integrity } = payload;

        try {
            await access(target);
        }
        catch (err) {
            console.log(err);
        }
        if (integrity) {
            if (isStarted === false) {
                const { sha512: [{ digest: val }] } = await integ(target);
                isStarted = val;
            }
            else if (isStarted !== await integ(target)) {
                console.log("le fichier est corrompu");
            }
        }
        await checkRules(rules, target, name, metrics);
        console.log("-------------------------------------------------------------------");
    });

    await FSC.ready();
});

FSC.on("sleep", async() => {
    await profiles.free();
    console.log("addon stopped");
});

module.exports = FSC;
