const fse = require("fs-extra");
const path = require("path");
const fsePromises = require("fs-extra").promises;
const {
    defaultJSONA11yOutputFolder,
    defaultHTMLOutputFolder,
} = require("./consts");
const generateReport = require("./generateReport");

const beforeRunHook = async ({ config }) => {
    fse.emptyDir(path.join("./", defaultJSONA11yOutputFolder), (err) => {
        if (err) return console.error(err);
    });

    fse.emptyDir(path.join("./", defaultHTMLOutputFolder), (err) => {
        if (err) return console.error(err);
    });
};

const afterRunHook = async ({ config, runs }) => {
    let files = await fsePromises.readdir(
        path.join("./", defaultJSONA11yOutputFolder),
        (error, filenames) => {
            if (error) {
                console.log(error);
            }
            return filenames;
        }
    );

    if (files.length > 0) {
        await generateReport(files);
    } else {
        await fsePromises.rmdir(path.join("./", defaultHTMLOutputFolder));
    }
    await fsePromises.rmdir(path.join("./", defaultJSONA11yOutputFolder), {
        recursive: true,
    });
};

module.exports = {
    beforeRunHook,
    afterRunHook,
};
