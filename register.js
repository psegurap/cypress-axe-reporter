let drOpts = require("./lib/defaultReporterOptions");
let path = require("path");
let reporterOptions = Cypress.config("reporterOptions");

if (reporterOptions && reporterOptions.reportDir) {
    drOpts.reportDir = reporterOptions.reportDir;
}

const cypressAxeReporterCallBack = (violations) => {
    let file_name = `${
        Cypress.spec.baseName
    } - ${Cypress.currentTest.title.replace(/[^a-zA-Z ]/g, "")}.json`;

    if(Cypress.config("reporter") === "cypress-axe-reporter") {
        cy.url().then(url => {
            cy.writeFile(
                path.join("./", drOpts.reportDir, drOpts.a11yJsonDir, file_name),
                {
                    test_info: {
                        baseName: Cypress.spec.baseName,
                        fileName: Cypress.spec.fileName,
                        relative_path: Cypress.spec.relative,
                        spec_title: Cypress.currentTest.titlePath[0],
                        test_title: Cypress.currentTest.title,
                    },
                    a11y: {
                        url: url,
                        violations: violations.map(
                            ({ id, impact, description, help, helpUrl, nodes }) => ({
                                id,
                                impact,
                                description,
                                help,
                                helpUrl,
                                nodes: nodes.map(
                                    ({ html, target, failureSummary }) => ({
                                        html,
                                        target,
                                        failureSummary,
                                    })
                                ),
                            })
                        ),
                    },
                }
            );
        })
    }
};

Cypress.Commands.add("cypressAxeReporterCallBack", cypressAxeReporterCallBack);
