// Require Node.js Dependencies
const { readFile } = require("fs").promises;
const { join } = require("path");

// Require utils functions
const { ConfigFsc } = require("./src/utils");

// Require Slimio Dependencies
const Addon = require("@slimio/addon");

// Create addon FSC
const FSC = new Addon("FSC", {
    version: "0.1.0",
    verbose: true

}).lockOn("events");

FSC.on("start", () => {
    FSC.ready();
    async function main() {
        const json = await readFile(join(process.cwd(), "config.json"));
        const jsonParsed = JSON.parse(json);

        for (const [profileName, profile] of Object.entries(jsonParsed.profiles)) {
            const { target, rules } = profile;
            const classTool = new ConfigFsc(target, rules);
            if (!profile.active) {
                continue;
            }
            await classTool.checkRules();
        }
    }
    main().catch(console.error);
});

FSC.on("stop", () => {
    console.log("addon stopped");
});

module.exports = FSC;
