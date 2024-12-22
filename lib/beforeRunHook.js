const fse = require("fs-extra");
const path = require("path");
const { defaultJSONA11yOutputFolder } = require("./consts");

const beforeRunHook = async ({ config }) => {
    console.log("BEFORE HOOK");
    fse.emptyDir(path.join("./", defaultJSONA11yOutputFolder), (err) => {
        if (err) return console.error(err);
    });
};

module.exports = beforeRunHook;
