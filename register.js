let { defaultJSONA11yOutputFolder } = require("./lib/consts");
let path = require("path");

let reporterOptions = Cypress.config("reporterOptions");
console.log(Cypress.config());

if (reporterOptions && reporterOptions.reportDir) {
    defaultJSONA11yOutputFolder = reporterOptions.reportDir + "/json/";
}

console.log(defaultJSONA11yOutputFolder);

const cypressAxeReporterCallBack = (violations) => {
    let file_name = `${
        Cypress.spec.baseName
    } - ${Cypress.currentTest.title.replace(/[^a-zA-Z ]/g, "")}.json`;

    cy.writeFile(path.join("./", defaultJSONA11yOutputFolder, file_name), {
        test_info: {
            baseName: Cypress.spec.baseName,
            fileName: Cypress.spec.fileName,
            relative_path: Cypress.spec.relative,
            spec_title: Cypress.currentTest.titlePath[0],
            test_title: Cypress.currentTest.title,
        },
        a11y: {
            url: window.location.origin,
            violations: violations.map(
                ({ id, impact, description, help, helpUrl, nodes }) => ({
                    id,
                    impact,
                    description,
                    help,
                    helpUrl,
                    nodes: nodes.map(({ html, target, failureSummary }) => ({
                        html,
                        target,
                        failureSummary,
                    })),
                })
            ),
        },
    });
};

Cypress.Commands.add("cypressAxeReporterCallBack", cypressAxeReporterCallBack);
