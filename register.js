let { defaultJSONA11yOutputFolder } = require("./lib/consts");

let reporterOptions = Cypress.config("reporterOptions");
console.log(reporterOptions);

let reportDir = reporterOptions.reportDir
    ? reporterOptions.reportDir + "/json/"
    : defaultJSONA11yOutputFolder;

const cypressAxeReporterCallBack = (violations) => {
    cy.writeFile(
        `./${
            reportDir + Cypress.spec.baseName
        } - ${Cypress.currentTest.title.replace(/[^a-zA-Z ]/g, "")}.json`,
        {
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
};

Cypress.Commands.add("cypressAxeReporterCallBack", cypressAxeReporterCallBack);
