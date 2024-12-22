const fse = require("fs-extra");
const path = require("path");
const { defaultJSONA11yOutputFolder } = require("./consts");
function afterRunHook(results) {
    console.log("AFTER HOOK")

    // fse.ensureDir(path.join("./", defaultJSONA11yOutputFolder))
    //     .then(() => {
    //         fse.writeJSON(
    //             path.join("./", defaultJSONA11yOutputFolder, "afterRunHook.json"),
    //             results,
    //             { spaces: 2 }
    //         );
    //     })
    //     .catch((error) => {
    //         console.log(error);
    //     });
}

module.exports = afterRunHook;
