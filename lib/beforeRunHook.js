const fse = require("fs-extra");
const path = require("path");
const { defaultJSONA11yOutputFolder, defaultHTMLOutputFolder } = require("./consts");

const beforeRunHook = async ({ config }) => {
    fse.emptyDir(path.join("./", defaultJSONA11yOutputFolder), (err) => {
        if (err) return console.error(err);
    });

    fse.emptyDir(path.join("./", defaultHTMLOutputFolder), (err) => {
        if (err) return console.error(err);
    });
};

module.exports = beforeRunHook;
