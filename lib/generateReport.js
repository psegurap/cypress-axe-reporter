const fse = require("fs-extra");
const path = require("path");
const JSDOM = require("jsdom").JSDOM;
const {
    defaultJSONA11yOutputFolder,
    defaultHTMLOutputFolder,
} = require("./consts");

function generateReport(files) {
    const dom = new JSDOM(`<!DOCTYPE html><head><head><body><p></p></body>`);

    fse.ensureDir(path.join("./", defaultHTMLOutputFolder), (error) => {
        if (error) {
            console.log(error);
            return false;
        }

        // fse.writeFileSync(path.join("./", defaultHTMLOutputFolder, "report.html"), dom.window.document.body.outerHTML)
    });
}

module.exports = generateReport;
