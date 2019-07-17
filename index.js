// Require Node.js Dependencies
const { access, stat } = require("fs").promises;
const { join } = require("path");

const { entityAge, filesNumber, repositoryNumber,
    dirSize, readTime, integrity, spaceOfTarget } = require("./src/utils");

// Require Slimio Dependencies
const Config = require("@slimio/config");
const Addon = require("@slimio/addon");
const alert = require("@slimio/alert");
const metrics = require("@slimio/metrics");
const Scheduler = require("@slimio/scheduler");

// Create addon FSC
const FSC = new Addon("FSC", {
    version: "0.1.0",
    verbose: true
}).lockOn("events");
const { Entity } = metrics(FSC);
const { Alarm } = alert(FSC);

let intervalId;

// Déclare entities and MIC
const MyEntity = new Entity("MyEntity", {
    description: "Central metricsing"
});


/**
 * @version 0.1.0
 *
 * @async
 * @param {Array<String>} rules profile
 * @param {!String} target location
 * @param {!String} name profile
 * @param {!Boolean} metrics profile
 * @desc Check the active rules of a profile and send an alarm when the rules are reached.
 * @return {Promise<void>}
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
                const it = await filesNumber(target, name);
                if (st.isFile()) {
                    // new Alarm(`${name} : ${rule.name} target must be a path to a repository`, {
                    //     correlateKey: "files_number_alarm",
                    //     entity: MyEntity
                    // });
                    break;
                }
                else if (it > rule.value) {
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
                const it = await repositoryNumber(target, name);
                if (st.isFile()) {
                    // new Alarm(`${name} : ${rule.name} target must be a path to a repository`, {
                    //     correlateKey: "repository_number_alarm",
                    //     entity: MyEntity
                    // });
                    break;
                }
                else if (it > rule.value) {
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
                    console.log(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`);
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "size_limiter_alarm",
                    //     entity: MyEntity
                    // });
                }
                break;
            }
            case "read_time":
            {
                const it = await readTime(target);
                if (st.isDirectory()) {
                    // new Alarm(`${name} : ${rule.name} target must be a path to a repository`, {
                    //     correlateKey: "readtime_alarm",
                    //     entity: MyEntity
                    // });
                    break;
                }
                else if (it > rule.value) {
                    console.log(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`);
                    // new Alarm(`${name} : ${rule.name} | reached | ${it} expected => ${rule.value}`, {
                    //     correlateKey: "readtime_alarm",
                    //     entity: MyEntity
                    // });
                }
                break;
            }
            case "integrity":
            {
                const it = await integrity(target);
                if (st.isDirectory()) {
                    // new Alarm(`${name} : ${rule.name} target must be a path to a repository`, {
                    //     correlateKey: "integrity_alarm",
                    //     entity: MyEntity
                    // });
                    break;
                }
                break;
            }
        }
    }
}

FSC.on("awake", async() => {
    cfg = new Config(join(__dirname, "config.json"), {
        autoReload: true,
        writeOnSet: true
    });
    await cfg.read();
    
    const intervalTest = Object.values(cfg.payload.profiles);
    const arr = [];
 
    cfg.observableOf("profiles").subscribe({
        next(currProfiles) {
            for (let id = 0; id < intervalTest.length; id++) {
                const interval = currProfiles[intervalTest[id].name].interval;
                intervalTest[id].interval = new Scheduler({ interval });
                arr[id] = intervalTest[id];
            }
        },
        error(err) {
            console.error(err);
        }
    });
    setInterval(async() => {
        for (const profile of arr) {
            if (!profile.interval.walk()) {
                continue;
            }
            await access(profile.target);
            await checkRules(profile.rules, profile.target, profile.name, profile.metrics);
        }
    }, 100);
    await FSC.ready();
});

FSC.on("close", async() => {
    clearInterval(intervalId);
    await cfg.close();
    console.log("addon stopped");
});


// FSC.registerCallback(async function main() {
//     console.log("hello world");
// });
// FSC.schedule("main", new Scheduler({ interval: 1 }));

module.exports = FSC;
