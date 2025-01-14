const fse = require("fs-extra");
const path = require("path");
const fsePromises = require("fs-extra").promises;
let drOpts = require("./defaultReporterOptions");
const generateReport = require("./generateReport");

const beforeRunHook = async ({ config }) => {
    if (config.reporter !== "cypress-axe-reporter") {
        return;
    }

    if (config.reporterOptions && config.reporterOptions.reportDir) {
        drOpts.reportDir = config.reporterOptions.reportDir;
    }

    fse.emptyDir(
        path.join("./", drOpts.reportDir, drOpts.a11yJsonDir),
        (err) => {
            if (err) return console.error(err);
        }
    );
};

const afterRunHook = async ({ config, runs }) => {
    if (config.reporter !== "cypress-axe-reporter") {
        return;
    }

    let files_names = await fsePromises.readdir(
        path.join("./", drOpts.reportDir, drOpts.a11yJsonDir),
        (error, filenames) => {
            if (error) {
                console.log(error);
            }
            return filenames;
        }
    );

    if (files_names.length > 0) {
        await generateReport(config, files_names);
    }

    await fsePromises.rmdir(
        path.join("./", drOpts.reportDir, drOpts.a11yJsonDir),
        {
            recursive: true,
        }
    );
};

module.exports = {
    beforeRunHook,
    afterRunHook,
};
