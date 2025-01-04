const fse = require("fs-extra");
const fsePromises = require("fs-extra").promises;
const path = require("path");
const { defaultJSONA11yOutputFolder } = require("./consts");
const generateReport = require("./generateReport");

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
    }
    await fsePromises.rmdir(path.join("./", defaultJSONA11yOutputFolder), {
        recursive: true,
    });
};

module.exports = afterRunHook;
