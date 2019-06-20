const Addon = require("@slimio/addon");

const FSC = new Addon("FSC");


FSC.on("start", () => {
    FSC.ready();
});

module.exports = FSC;
