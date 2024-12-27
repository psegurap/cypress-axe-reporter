const fse = require("fs-extra");
const path = require("path");
const { defaultJSONA11yOutputFolder } = require("./consts");
const generateReport = require("./generateReport");
async function afterRunHook({config, runs, }) {
    fse.pathExists(
        path.join("./", defaultJSONA11yOutputFolder),
        (err, exists) => {
            if (exists) {
                fse.readdir(
                    path.join("./", defaultJSONA11yOutputFolder),
                    (error, filenames) => {
                        if (error) {
                            console.log(error);
                        }
                        if(filenames.length > 0) {
                            generateReport(filenames)
                        }
                    }
                );
            }
        }
    );
}

module.exports = afterRunHook;
