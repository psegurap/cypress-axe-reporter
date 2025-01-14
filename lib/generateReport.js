const fse = require("fs-extra");
const fsePromises = require("fs-extra").promises;
const path = require("path");
const JSDOM = require("jsdom").JSDOM;
let drOpts = require("./defaultReporterOptions");

const generateReport = async (config, files) => {
    if (config.reporterOptions) {
        if (config.reporterOptions.reportDir) {
            drOpts.reportDir = config.reporterOptions.reportDir;
        }

        if (config.reporterOptions.reportFilename) {
            drOpts.reportFilename = config.reporterOptions.reportFilename;
        }

        if (config.reporterOptions.reportPageTitle) {
            drOpts.reportPageTitle = config.reporterOptions.reportPageTitle;
        }

        if (config.reporterOptions.reportTitle) {
            drOpts.reportTitle = config.reporterOptions.reportTitle;
        }

        if (config.reporterOptions.saveJson !== undefined) {
            drOpts.saveJson = config.reporterOptions.saveJson;
        }

        if (config.reporterOptions.saveHtml !== undefined) {
            drOpts.saveHtml = config.reporterOptions.saveHtml;
        }
    }

    if (drOpts.saveJson) {
        fse.ensureDirSync(path.join("./", drOpts.reportDir, "/json/"));
        await generateJSONReport(files);
    }

    if (drOpts.saveHtml) {
        fse.ensureDirSync(path.join("./", drOpts.reportDir, "/html/"));
        await generateHTMLReport(files);
    }
};

const generateHTMLReport = async (files) => {
    console.log("BUILDING HTML REPORT...");

    const dom = new JSDOM(
        `<html><head><head><body filter_by_impact="all"></body><html>`
    );

    let document = dom.window.document;

    const customCreateElement = ({ tag, classes, attrs, text }) => {
        let element = document.createElement(tag);
        if (attrs) {
            attrs.forEach((attr) => {
                element.setAttribute(attr.key, attr.value);
            });
        }
        if (classes) element.classList.add(...classes);
        if (text) element.append(text);
        return element;
    };

    // Insert Styles
    let styles_path_exist = fse.pathExistsSync(
        path.join(__dirname, "/styles.min.css")
    );

    if (styles_path_exist) {
        let file_info = await fsePromises.readFile(
            path.join(__dirname, "/styles.min.css"),
            "utf8"
        );

        let bulma_styles = customCreateElement({
            tag: "style",
            text: file_info,
        });
        let meta_charset = customCreateElement({
            tag: "meta",
            attrs: [{ key: "charset", value: "utf-8" }],
        });

        let meta_viewport = customCreateElement({
            tag: "meta",
            attrs: [
                { key: "name", value: "viewport" },
                {
                    key: "content",
                    value: "width=device-width, initial-scale=1",
                },
            ],
        });
        let title_head_tag = customCreateElement({
            tag: "title",
            text: drOpts.reportPageTitle,
        });
        document.head.append(
            meta_charset,
            meta_viewport,
            bulma_styles,
            title_head_tag
        );
    }

    // Create Body
    const createElementsNodesTable = ({ nodes }) => {
        let div_table_container = customCreateElement({
            tag: "div",
            classes: ["table-container"],
        });
        let table_nodes = customCreateElement({
            tag: "table",
            classes: [
                "table",
                "is-bordered",
                "is-fullwidth",
                "is-hoverable",
                "is-size-7",
                "mt-2",
            ],
        });

        let thead = customCreateElement({ tag: "thead" });
        let tr_heading = customCreateElement({ tag: "tr" });
        let th_target = customCreateElement({
            tag: "th",
            text: "Selector",
            attrs: [{ key: "style", value: "width:30%" }],
        });
        let th_html = customCreateElement({ tag: "th", text: "Element" });
        tr_heading.append(th_target, th_html);
        thead.append(tr_heading);

        let tbody = customCreateElement({ tag: "tbody" });

        nodes.forEach((node) => {
            let tr_node = customCreateElement({ tag: "tr" });
            let td_target = customCreateElement({
                tag: "td",
                text: node.target.toString(),
                attrs: [{ key: "style", value: "width:30%" }],
            });
            let td_html = customCreateElement({ tag: "td" });
            let code_html = customCreateElement({
                tag: "code",
                text: node.html,
            });

            td_html.append(code_html);

            tr_node.append(td_target, td_html);

            tbody.append(tr_node);
        });

        table_nodes.append(thead, tbody);

        div_table_container.append(table_nodes);

        return div_table_container;
    };

    const createNavBar = () => {
        let nav_container = customCreateElement({
            tag: "nav",
            classes: ["navbar", "has-background-black-bold"],
            attrs: [
                { key: "role", value: "navigation" },
                { key: "aria-label", value: "main navigation" },
            ],
        });

        let div_navbar_start = customCreateElement({
            tag: "div",
            classes: ["navbar-start", "is-flex", "is-justify-content-center"],
        });

        let div_start_navbar_item = customCreateElement({
            tag: "div",
            classes: ["navbar-item"],
        });

        let h5_page_title = customCreateElement({
            tag: "h5",
            classes: ["subtitle", "is-5", "has-text-white"],
            text: drOpts.reportTitle,
        });

        div_start_navbar_item.append(h5_page_title);
        div_navbar_start.append(div_start_navbar_item);

        let div_navbar_end = customCreateElement({
            tag: "div",
            classes: ["navbar-end", "is-flex", "is-justify-content-center"],
        });

        let div_end_navbar_item = customCreateElement({
            tag: "div",
            classes: ["navbar-item", "is-gapless"],
        });

        let button_filter_by_all = customCreateElement({
            tag: "button",
            classes: ["button", "is-small", "ml-2", "is-info", "is-dark"],
            attrs: [
                { key: "type", value: "button" },
                {
                    key: "onclick",
                    value: `(function () {let buttons=document.querySelectorAll(".navbar-end button");buttons.forEach((button)=>{button.classList.remove("is-info","is-dark")});event.target.classList.add("is-info","is-dark");document.body.setAttribute("filter_by_impact","all");}())`,
                },
            ],
            text: "All",
        });

        let button_filter_by_critical = customCreateElement({
            tag: "button",
            classes: ["button", "is-small", "ml-2"],
            attrs: [
                { key: "type", value: "button" },
                {
                    key: "onclick",
                    value: `(function () {let buttons=document.querySelectorAll(".navbar-end button");buttons.forEach((button)=>{button.classList.remove("is-info","is-dark")});event.target.classList.add("is-info","is-dark");document.body.setAttribute("filter_by_impact","critical");}())`,
                },
            ],
            text: "Critical",
        });

        let button_filter_by_serious = customCreateElement({
            tag: "button",
            classes: ["button", "is-small", "ml-2"],
            attrs: [
                { key: "type", value: "button" },
                {
                    key: "onclick",
                    value: `(function () {let buttons=document.querySelectorAll(".navbar-end button");buttons.forEach((button)=>{button.classList.remove("is-info","is-dark")});event.target.classList.add("is-info","is-dark");document.body.setAttribute("filter_by_impact","serious");}())`,
                },
            ],
            text: "Serious",
        });

        let button_filter_by_moderate = customCreateElement({
            tag: "button",
            classes: ["button", "is-small", "ml-2"],
            attrs: [
                { key: "type", value: "button" },
                {
                    key: "onclick",
                    value: `(function () {let buttons=document.querySelectorAll(".navbar-end button");buttons.forEach((button)=>{button.classList.remove("is-info","is-dark")});event.target.classList.add("is-info","is-dark");document.body.setAttribute("filter_by_impact","moderate");}())`,
                },
            ],
            text: "Moderate",
        });

        let button_filter_by_minor = customCreateElement({
            tag: "button",
            classes: ["button", "is-small", "ml-2"],
            attrs: [
                { key: "type", value: "button" },
                {
                    key: "onclick",
                    value: `(function () {let buttons=document.querySelectorAll(".navbar-end button");buttons.forEach((button)=>{button.classList.remove("is-info","is-dark")});event.target.classList.add("is-info","is-dark");document.body.setAttribute("filter_by_impact","minor");}())`,
                },
            ],
            text: "Minor",
        });

        div_end_navbar_item.append(
            button_filter_by_all,
            button_filter_by_critical,
            button_filter_by_serious,
            button_filter_by_moderate,
            button_filter_by_minor
        );
        div_navbar_end.append(div_end_navbar_item);

        nav_container.append(div_navbar_start, div_navbar_end);
        return nav_container;
    };

    const createViolationsCountTags = (color, label, count = 0) => {
        let div_count_container = customCreateElement({
            tag: "div",
            classes: ["has-addons", "mb-0", "tags"],
        });

        let div_count_label = customCreateElement({
            tag: "span",
            classes: ["tag", color, "is-light"],
            text: label,
        });

        let div_count_number = customCreateElement({
            tag: "span",
            classes: ["tag"],
            text: count.toString(),
        });

        div_count_container.append(div_count_label, div_count_number);
        return div_count_container;
    };

    const generateSingleSpecCard = (spec) => {
        let li_spec_card = customCreateElement({
            tag: "li",
            classes: ["card", "hiding_details"],
        });
        let div_spec_card_header = customCreateElement({
            tag: "div",
            classes: ["card-header", "py-2", "px-3", "is-block"],
        });

        let p_spec_and_test_title = customCreateElement({
            tag: "p",
            classes: ["has-text-weight-semibold"],
            text: `${spec.test_info.spec_title} | ${spec.test_info.test_title}`,
        });
        let p_spec_relative_path = customCreateElement({
            tag: "p",
            classes: ["is-italic"],
            text: spec.test_info.relative_path.replaceAll("\\", "/"),
        });
        let a_test_url = customCreateElement({
            tag: "a",
            classes: [
                "has-text-weight-medium",
                "is-underlined",
                "has-text-dark",
            ],
            attrs: [
                { key: "href", value: spec.a11y.url },
                { key: "target", value: "_blank" },
            ],
            text: spec.a11y.url,
        });

        let div_tags_violations_count_container = customCreateElement({
            tag: "div",
            classes: ["mt-1", "is-flex", "is-gap-1", "has-text-weight-medium"],
        });

        let critical_count_tag = createViolationsCountTags(
            "is-danger",
            "Critical",
            spec.a11y.violations.filter(
                (violation) => violation.impact == "critical"
            ).length
        );
        let serious_count_tag = createViolationsCountTags(
            "is-warning",
            "Serious",
            spec.a11y.violations.filter(
                (violation) => violation.impact == "serious"
            ).length
        );
        let moderate_count_tag = createViolationsCountTags(
            "is-success",
            "Moderate",
            spec.a11y.violations.filter(
                (violation) => violation.impact == "moderate"
            ).length
        );
        let minor_count_tag = createViolationsCountTags(
            "is-info",
            "Minor",
            spec.a11y.violations.filter(
                (violation) => violation.impact == "minor"
            ).length
        );

        div_tags_violations_count_container.append(
            critical_count_tag,
            serious_count_tag,
            moderate_count_tag,
            minor_count_tag
        );

        let button_view_details = customCreateElement({
            tag: "button",
            classes: [
                "button",
                "is-ghost",
                "is-small",
                "px-1",
                "view-details-button",
                "is-hidden",
            ],
            text: "View Details",
            attrs: [
                {
                    key: "onclick",
                    value: "event.target.parentNode.parentNode.classList.toggle('hiding_details');",
                },
            ],
        });

        let button_hide_details = customCreateElement({
            tag: "button",
            classes: [
                "button",
                "is-ghost",
                "is-small",
                "px-1",
                "hide-details-button",
            ],
            text: "Hide Details",
            attrs: [
                {
                    key: "onclick",
                    value: "event.target.parentNode.parentNode.classList.toggle('hiding_details');",
                },
            ],
        });

        div_spec_card_header.append(
            p_spec_and_test_title,
            p_spec_relative_path,
            a_test_url,
            div_tags_violations_count_container,
            button_view_details,
            button_hide_details
        );

        let div_spec_card_content = customCreateElement({
            tag: "div",
            classes: ["card-content"],
        });

        let ul_violations_list = customCreateElement({ tag: "ul" });

        spec.a11y.violations.forEach((violation) => {
            let li_violation_container = customCreateElement({
                tag: "li",
                classes: [
                    "has-background-grey-lighter",
                    "block",
                    "pt-2",
                    "pb-3",
                    "px-3",
                ],
                attrs: [{ key: "impact", value: violation.impact }],
            });

            let p_violation_impact_label = customCreateElement({
                tag: "p",
                classes: ["has-text-weight-medium", "is-size-7"],
                text: "Impact: ",
            });

            let impact_tag_color;
            switch (violation.impact) {
                case "critical":
                    impact_tag_color = "is-danger";
                    break;
                case "serious":
                    impact_tag_color = "is-warning";
                    break;
                case "moderate":
                    impact_tag_color = "is-success";
                    break;
                case "minor":
                    impact_tag_color = "is-info";
                    break;
                default:
                    impact_tag_color = "is-primary";
                    break;
            }

            let span_violation_impact_tag = customCreateElement({
                tag: "span",
                classes: [
                    "tag",
                    impact_tag_color,
                    "is-light",
                    "is-capitalized",
                ],
                text: violation.impact,
            });

            p_violation_impact_label.append(span_violation_impact_tag);

            let p_violation_description_label = customCreateElement({
                tag: "p",
                classes: ["has-text-weight-medium", "is-size-7"],
                text: "Description: ",
            });
            let span_violation_description_details = customCreateElement({
                tag: "span",
                classes: ["has-text-weight-normal"],
                text: violation.description,
            });

            p_violation_description_label.append(
                span_violation_description_details
            );

            let p_violation_elements_nodes_label = customCreateElement({
                tag: "p",
                classes: ["has-text-weight-medium", "is-size-7"],
                text: "Elements/Nodes:",
            });

            li_violation_container.append(
                p_violation_impact_label,
                p_violation_description_label,
                p_violation_elements_nodes_label,
                createElementsNodesTable(violation)
            );

            ul_violations_list.append(li_violation_container);
        });

        div_spec_card_content.append(ul_violations_list);

        li_spec_card.append(div_spec_card_header, div_spec_card_content);
        return li_spec_card;
    };

    let ul_specs_main_container = customCreateElement({
        tag: "ul",
        classes: ["container", "is-fluid", "py-5"],
        attrs: [{ key: "id", value: "specs-main-container" }],
    });

    files.map((file) => {
        let test_result = fse.readJsonSync(
            path.join("./", drOpts.reportDir, drOpts.a11yJsonDir, file)
        );
        ul_specs_main_container.append(generateSingleSpecCard(test_result));
    });

    document.body.append(createNavBar(), ul_specs_main_container);

    let store_report_on_location = path.join(
        "./",
        drOpts.reportDir,
        "/html/",
        drOpts.reportFilename + ".html"
    );

    await fsePromises.writeFile(
        store_report_on_location,
        "<!DOCTYPE html>" + document.documentElement.outerHTML
    );

    console.log("REPORT SAVED ON: " + store_report_on_location);
};

const generateJSONReport = async (files) => {
    console.log("BUILDING JSON REPORT...");

    var test_results = files.map((file) => {
        let test_result = fse.readJsonSync(
            path.join("./", drOpts.reportDir, drOpts.a11yJsonDir, file)
        );
        return test_result;
    });

    let store_report_on_location = path.join(
        "./",
        drOpts.reportDir,
        "/json/",
        drOpts.reportFilename + ".json"
    );

    await fsePromises.writeFile(
        store_report_on_location,
        JSON.stringify(test_results, null, 2)
    );

    console.log("REPORT SAVED ON: " + store_report_on_location);
};

module.exports = generateReport;
