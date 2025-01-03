const fse = require("fs-extra");
const fsePromises = require("fs-extra").promises;
const path = require("path");
const { defaultJSONA11yOutputFolder } = require("./consts");
const generateReport = require("./generateReport");

const afterRunHook = async ({ config, runs }) => {
    let json_output_folder_exists = fse.pathExistsSync(
        path.join("./", defaultJSONA11yOutputFolder)
    );

    if (json_output_folder_exists) {
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
    }
};

module.exports = afterRunHook;
