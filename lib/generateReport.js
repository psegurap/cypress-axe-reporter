const fse = require("fs-extra");
const fsePromises = require("fs-extra").promises;
const path = require("path");
const JSDOM = require("jsdom").JSDOM;
let drOpts = require("./defaultReporterOptions");

const generateReport = async (config, files) => {
    if (config.reporterOptions) {
        drOpts = { ...drOpts, ...config.reporterOptions };
    }

    var test_results = files.map((file) => {
        let test_result = fse.readJsonSync(
            path.join("./", drOpts.reportDir, drOpts.a11yJsonDir, file)
        );
        return test_result;
    });

    if (drOpts.saveJson) {
        fse.ensureDirSync(path.join("./", drOpts.reportDir));
        await generateJSONReport(test_results);
    }

    if (drOpts.saveHtml) {
        fse.ensureDirSync(path.join("./", drOpts.reportDir));
        await generateHTMLReport(test_results);
    }
};

const generateHTMLReport = async (specs_results) => {
    console.log("BUILDING HTML REPORT...");

    const dom = new JSDOM(
        `<html  lang="en" class="h-full"><head><head><body class="h-full bg-gray-100" data-filter="all"></body><html>`
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

    const customCreateElementNS = ({ tag, classes, attrs, namespace }) => {
        let element = document.createElementNS(namespace, tag);
        if (attrs) {
            attrs.forEach((attr) => {
                element.setAttribute(attr.key, attr.value);
            });
        }
        if (classes) element.classList.add(...classes);
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

        let tailwind_styles = customCreateElement({
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
            tailwind_styles,
            title_head_tag
        );
    }

    // Header
    const createHeader = () => {
        let header_container = customCreateElement({
            tag: "header",
            classes: ["relative", "bg-white", "shadow-sm"],
        });

        let div_page_name_filters_container = customCreateElement({
            tag: "div",
            classes: [
                "mx-auto",
                "flex",
                "flex-col",
                "md:flex-row",
                "justify-between",
                "max-w-7xl",
                "p-4",
                "md:px-8",
            ],
        });

        let div_page_name_container = customCreateElement({
            tag: "div",
            classes: [
                "relative",
                "z-10",
                "flex",
                "justify-center",
                "md:justify-start",
                "pb-2",
                "col-span-2",
                "md:col-span-1",
            ],
        });

        let h1_page_name = customCreateElement({
            tag: "h1",
            classes: ["text-xl", "font-medium"],
            text: drOpts.reportTitle,
        });

        div_page_name_container.append(h1_page_name);

        let nav_filters_container = customCreateElement({
            tag: "nav",
            classes: [
                "flex",
                "flex-wrap",
                "justify-center",
                "md:justify-end",
                "space-x-2",
                "md:col-span-1",
            ],
        });

        let buttons_filter = [
            "all",
            "critical",
            "serious",
            "moderate",
            "minor",
        ].map((impact) => {
            let button_filter = customCreateElement({
                tag: "button",
                classes: [
                    "inline-flex",
                    "items-center",
                    "rounded-md",
                    "px-3",
                    "py-2",
                    "text-sm",
                    "font-medium",
                    "text-gray-900",
                    "hover:bg-gray-50",
                    "capitalize",
                ],
                attrs: [
                    { key: "type", value: "button" },
                    { key: "data-filter-by", value: impact.toLowerCase() },
                    {
                        key: "onclick",
                        value: `document.body.setAttribute("data-filter", "${impact}")`,
                    },
                ],
                text: impact,
            });
            return button_filter;
        });

        nav_filters_container.append(...buttons_filter);

        div_page_name_filters_container.append(
            div_page_name_container,
            nav_filters_container
        );

        header_container.append(div_page_name_filters_container);
        return header_container;
    };

    document.body.append(createHeader());

    // Summary: all violations from all files
    if (drOpts.includeSummary) {
        const specSummary = (() => {
            let total_violations = 0,
                critical = 0,
                serious = 0,
                moderate = 0,
                minor = 0;

            specs_results.forEach((spec) => {
                total_violations += spec.a11y.violations.length;
                spec.a11y.violations.forEach((violation) => {
                    if (violation.impact.toLowerCase() == "critical")
                        ++critical;
                    if (violation.impact.toLowerCase() == "serious") ++serious;
                    if (violation.impact.toLowerCase() == "moderate")
                        ++moderate;
                    if (violation.impact.toLowerCase() == "minor") ++minor;
                });
            });

            return { total_violations, critical, serious, moderate, minor };
        })();

        const createSummary = () => {
            let ul_counts_container = customCreateElement({
                tag: "ul",
                classes: [
                    "grid",
                    "grid-cols-1",
                    "gap-5",
                    "sm:grid-cols-2",
                    "sm:gap-6",
                    "lg:grid-cols-4",
                    "max-w-7xl",
                    "p-4",
                    "pb-0",
                    "sm:p-6",
                    "sm:pb-0",
                    "lg:p-8",
                    "lg:pb-0",
                    "mx-auto",
                ],
            });

            ((
                impact_counts = [
                    {
                        name: "critical",
                        count: specSummary.critical,
                        color: "red",
                    },
                    {
                        name: "serious",
                        count: specSummary.serious,
                        color: "yellow",
                    },
                    {
                        name: "moderate",
                        count: specSummary.moderate,
                        color: "green",
                    },
                    { name: "minor", count: specSummary.minor, color: "cyan" },
                ]
            ) => {
                impact_counts.forEach((impact) => {
                    let li_count_summary_container = customCreateElement({
                        tag: "li",
                        classes: [
                            "col-span-1",
                            "flex",
                            "rounded-md",
                            "shadow-xs",
                        ],
                    });

                    let div_impact_name = customCreateElement({
                        tag: "div",
                        classes: [
                            "flex",
                            "px-4",
                            "shrink-0",
                            "items-center",
                            "justify-center",
                            "rounded-l-md",
                            `bg-${impact.color}-200`,
                            `text-${impact.color}-800`,
                            `border-${impact.color}-600/15`,
                            "border",
                            "rounded-l-sm",
                            "font-medium",
                            "capitalize",
                        ],
                        text: impact.name,
                    });

                    let div_count_percent_container = customCreateElement({
                        tag: "div",
                        classes: [
                            "flex",
                            "items-center",
                            "justify-between",
                            "px-4",
                            "py-2",
                            "rounded-r-sm",
                            "border",
                            "border-l-0",
                            "border-gray-300",
                            "bg-white",
                            "w-full",
                            "divide-x",
                            "divide-gray-200",
                        ],
                    });

                    let span_count = customCreateElement({
                        tag: "span",
                        classes: [
                            "font-medium",
                            "text-gray-700",
                            "mr-2",
                            "flex-grow",
                        ],
                        text: impact.count.toString(),
                    });

                    let span_percent = customCreateElement({
                        tag: "span",
                        classes: ["text-gray-500", "text-sm", "pl-2"],
                        text:
                            Math.round(
                                (impact.count / specSummary.total_violations) *
                                    100
                            ) + "%",
                    });

                    // <div class="flex items-center justify-between px-4 py-2 rounded-r-sm border border-l-0 border-gray-300 bg-white w-full divide-x divide-gray-200">
                    //     <span class="font-medium text-gray-700 mr-2 flex-grow">32</span>

                    //     <p class="text-gray-500 text-sm">20%</p>
                    // </div>

                    div_count_percent_container.append(
                        span_count,
                        span_percent
                    );

                    li_count_summary_container.append(
                        div_impact_name,
                        div_count_percent_container
                    );

                    ul_counts_container.append(li_count_summary_container);
                });
            })();

            return ul_counts_container;
        };

        document.body.append(createSummary());
    }

    // Cards Header: violation count and spec name
    const createCardHeader = (spec) => {
        let button_card_header = customCreateElement({
            tag: "button",
            classes: [
                "cursor-pointer",
                "text-start",
                "px-4",
                "py-3",
                "w-full",
                "focus:outline-1",
                "focus:outline-cyan-600/50",
                "group",
                "relative",
            ],
            attrs: [
                { key: "type", value: "button" },
                { key: "aria-expanded", value: true },
                {
                    key: "onclick",
                    value: `(() => event.target.parentNode.setAttribute("aria-expanded", !(event.target.parentNode.getAttribute("aria-expanded") === "true")))()`,
                },
            ],
        });

        let span_clickable = customCreateElement({
            tag: "span",
            classes: ["absolute", "inset-0"],
        });

        let div_spec_name_container = customCreateElement({
            tag: "div",
            classes: ["flex", "flex-row", "justify-between"],
        });

        let h2_spec_file_name = customCreateElement({
            tag: "h2",
            classes: ["flex", "flex-col", "text-gray-900"],
        });

        let span_spec_name = customCreateElement({
            tag: "span",
            classes: ["font-medium"],
            text: `${spec.test_info.spec_title} | ${spec.test_info.test_title}`,
        });

        let span_file_name = customCreateElement({
            tag: "span",
            classes: ["italic", "text-gray-600"],
            text: spec.test_info.relative_path.replaceAll("\\", "/"),
        });

        h2_spec_file_name.append(span_spec_name, span_file_name);

        let svg_arrow_icon = customCreateElementNS({
            tag: "svg",
            namespace: "http://www.w3.org/2000/svg",
            classes: [
                "bi",
                "bi-arrow-up-short",
                "text-md",
                "font-[500]",
                "arrow-icon",
            ],
            attrs: [
                { key: "xmlns", value: "http://www.w3.org/2000/svg" },
                { key: "width", value: "20" },
                { key: "height", value: "20" },
                { key: "fill", value: "currentColor" },
                { key: "viewBox", value: "0 0 16 16" },
            ],
        });

        let path_svg = customCreateElementNS({
            tag: "path",
            namespace: "http://www.w3.org/2000/svg",
            attrs: [
                { key: "fill-rule", value: "evenodd" },
                {
                    key: "d",
                    value: "M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5",
                },
            ],
        });

        svg_arrow_icon.append(path_svg);
        div_spec_name_container.append(h2_spec_file_name, svg_arrow_icon);

        const specSummary = (() => {
            let critical = 0,
                serious = 0,
                moderate = 0,
                minor = 0;

            spec.a11y.violations.forEach((violation) => {
                if (violation.impact.toLowerCase() == "critical") ++critical;
                if (violation.impact.toLowerCase() == "serious") ++serious;
                if (violation.impact.toLowerCase() == "moderate") ++moderate;
                if (violation.impact.toLowerCase() == "minor") ++minor;
            });

            button_card_header.setAttribute(
                "data-has-impact",
                [
                    critical > 0 ? "critical" : "",
                    serious > 0 ? "serious" : "",
                    moderate > 0 ? "moderate" : "",
                    minor > 0 ? "minor" : "",
                ]
                    .filter(Boolean)
                    .join("|")
            );

            return { critical, serious, moderate, minor };
        })();

        let ul_spec_summary = customCreateElement({
            tag: "ul",
            classes: [
                "mt-3",
                "flex",
                "flex-row",
                "flex-wrap",
                "gap-2",
                "gap-x-3",
            ],
        });

        let lis_summary_cards = ((
            elements = [
                { name: "Critical", color: "red", count: specSummary.critical },
                {
                    name: "Serious",
                    color: "yellow",
                    count: specSummary.serious,
                },
                {
                    name: "Moderate",
                    color: "green",
                    count: specSummary.moderate,
                },
                { name: "Minor", color: "cyan", count: specSummary.minor },
            ]
        ) => {
            let lis = elements.map((element) => {
                let li = customCreateElement({
                    tag: "li",
                    classes: [
                        "text-[13px]",
                        "h-6",
                        "flex",
                        "items-center",
                        "rounded-sm",
                        "text-sm",
                    ],
                });

                li.append(
                    customCreateElement({
                        tag: "span",
                        classes: [
                            `bg-${element.color}-200`,
                            `text-${element.color}-800`,
                            "px-3",
                            "tracking-wide",
                            "h-full",
                            "flex",
                            "items-center",
                            "justify-center",
                            "inset-ring",
                            `inset-ring-${element.color}-600/15`,
                            "rounded-l-sm",
                        ],
                        text: element.name,
                    }),
                    customCreateElement({
                        tag: "span",
                        classes: [
                            "text-center",
                            "flex-grow",
                            "md:flex-grow-0",
                            "px-2",
                            "bg-gray-50",
                            "h-full",
                            "flex",
                            "items-center",
                            "border",
                            "border-l-0",
                            "border-gray-200",
                            "justify-center",
                            "rounded-r-sm",
                        ],
                        text: element.count.toString(),
                    })
                );
                return li;
            });

            return lis;
        })();

        ul_spec_summary.append(...lis_summary_cards);

        button_card_header.append(
            span_clickable,
            div_spec_name_container,
            ul_spec_summary
        );

        return button_card_header;
    };

    // Cards Body: violations details
    const createCardBody = (spec) => {
        let ul_card_body = customCreateElement({
            tag: "ul",
            classes: ["px-4", "sm:px-6", "card-body"],
        });

        spec.a11y.violations.forEach((violation) => {
            let li_violation_container = customCreateElement({
                tag: "li",
                classes: ["py-4", "hidden"],
                attrs: [
                    {
                        key: "data-has-impact",
                        value: violation.impact.toLowerCase(),
                    },
                ],
            });

            let div_impact_description_container = customCreateElement({
                tag: "div",
                classes: [
                    "text-[13px]",
                    "flex",
                    "items-stretch",
                    "items-center",
                    "rounded-sm",
                    "text-sm",
                    "border-gray-200",
                ],
            });

            let impact_color = (() => {
                if (violation.impact.toLowerCase() == "critical") return "red";
                if (violation.impact.toLowerCase() == "serious")
                    return "yellow";
                if (violation.impact.toLowerCase() == "moderate")
                    return "green";
                if (violation.impact.toLowerCase() == "minor") return "cyan";
            })();

            let span_impact = customCreateElement({
                tag: "span",
                classes: [
                    `bg-${impact_color}-200`,
                    `text-${impact_color}-800`,
                    "px-3",
                    "py-1",
                    "tracking-wide",
                    "flex",
                    "items-center",
                    "justify-center",
                    "border",
                    `border-${impact_color}-600/15`,
                    "rounded-l-sm",
                    "capitalize",
                ],
                text: violation.impact,
            });

            let span_description = customCreateElement({
                tag: "span",
                classes: [
                    "px-2",
                    "py-1",
                    "bg-gray-50",
                    "h-full",
                    "flex",
                    "items-center",
                    "border",
                    "border-l-0",
                    "border-gray-300",
                    "justify-center",
                    "rounded-r-sm",
                    "mr-2",
                ],
                text: violation.description.toString(),
            });

            let a_help_url = customCreateElement({
                tag: "a",
                classes: [
                    "border",
                    "border-gray-200",
                    "ml-2",
                    "px-1",
                    "ml-auto",
                    "rounded-sm",
                    "flex",
                    "items-center",
                    "hover:bg-gray-100",
                ],
                attrs: [
                    { key: "href", value: violation.helpUrl },
                    { key: "target", value: "_blank" },
                    { key: "aria-label", value: "More details." },
                ],
            });

            let svg_help_url_icon = customCreateElementNS({
                tag: "svg",
                namespace: "http://www.w3.org/2000/svg",
                classes: ["text-gray-800"],
                attrs: [
                    { key: "aria-hidden", value: true },
                    { key: "width", value: "20" },
                    { key: "height", value: "20" },
                    { key: "fill", value: "none" },
                    { key: "viewBox", value: "0 0 24 24" },
                ],
            });

            let path_help_url_icon = customCreateElementNS({
                tag: "path",
                namespace: "http://www.w3.org/2000/svg",
                attrs: [
                    { key: "stroke", value: "currentColor" },
                    { key: "stroke-linecap", value: "round" },
                    { key: "stroke-linejoin", value: "round" },
                    { key: "stroke-width", value: "2" },

                    {
                        key: "d",
                        value: "M18 14v4.833A1.166 1.166 0 0 1 16.833 20H5.167A1.167 1.167 0 0 1 4 18.833V7.167A1.166 1.166 0 0 1 5.167 6h4.618m4.447-2H20v5.768m-7.889 2.121 7.778-7.778",
                    },
                ],
            });

            svg_help_url_icon.append(path_help_url_icon);
            a_help_url.append(svg_help_url_icon);

            div_impact_description_container.append(
                span_impact,
                span_description,
                a_help_url
            );

            let div_table_container = customCreateElement({
                tag: "div",
                classes: [
                    "mt-3",
                    "flow-root",
                    "overflow-hidden",
                    "border",
                    "border-gray-200",
                    "rounded",
                ],
            });

            let table_nodes_container = customCreateElement({
                tag: "table",
                classes: ["w-full", "text-left", "divide-y", "divide-gray-200"],
            });

            let thead_nodes = customCreateElement({
                tag: "thead",
                classes: ["bg-gray-50"],
            });

            let tr_heading = customCreateElement({
                tag: "tr",
                classes: [
                    "text-left",
                    "text-sm",
                    "font-semibold",
                    "text-gray-900",
                ],
            });

            let th_selector_heading = customCreateElement({
                tag: "th",
                classes: ["px-3", "py-2"],
                attrs: [
                    { key: "style", value: "width: 30%" },
                    { key: "scope", value: "col" },
                ],
                text: "Selector",
            });

            let th_element_heading = customCreateElement({
                tag: "th",
                classes: ["px-3", "py-2"],
                attrs: [{ key: "scope", value: "col" }],
                text: "Element",
            });

            tr_heading.append(th_selector_heading, th_element_heading);
            thead_nodes.append(tr_heading);

            let tbody_nodes = customCreateElement({
                tag: "tbody",
                classes: ["divide-y", "divide-gray-200", "bg-white"],
            });

            violation.nodes.forEach((node) => {
                let tr_node = customCreateElement({
                    tag: "tr",
                });

                let td_selector_body = customCreateElement({
                    tag: "td",
                    classes: [
                        "px-3",
                        "min-h-[50px]",
                        "align-top",
                        "py-2",
                        "text-wrap",
                        "text-sm",
                        "relative",
                    ],
                });

                let button_copy_selector_container = customCreateElement({
                    tag: "button",
                    classes: [
                        "text-gray-900",
                        "text-nowrap",
                        "m-0.5",
                        "hover:bg-gray-100",
                        "rounded-lg",
                        "py-2",
                        "px-2.5",
                        "inline-flex",
                        "items-center",
                        "justify-center",
                        "bg-white",
                        "border-gray-200",
                        "border",
                        "h-8",
                    ],
                    attrs: [
                        {
                            key: "onclick",
                            value: `navigator.clipboard.writeText(\`${node.target}\`)`,
                        },
                    ],
                });

                let span_copy_selector = customCreateElement({
                    tag: "span",
                    classes: ["inline-flex", "items-center"],
                });

                let svg_copy_icon_selector = customCreateElementNS({
                    tag: "svg",
                    namespace: "http://www.w3.org/2000/svg",
                    classes: ["w-3", "h-3", "me-1.5"],
                    attrs: [
                        { key: "aria-hidden", value: true },
                        { key: "fill", value: "currentColor" },
                        { key: "viewBox", value: "0 0 18 20" },
                    ],
                });

                let path_copy_icon_selector = customCreateElementNS({
                    tag: "path",
                    namespace: "http://www.w3.org/2000/svg",
                    attrs: [
                        {
                            key: "d",
                            value: "M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.993 1.993 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2Zm-3 14H5a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2Zm0-4H5a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2Zm0-5H5a1 1 0 0 1 0-2h2V2h4v2h2a1 1 0 1 1 0 2Z",
                        },
                    ],
                });

                svg_copy_icon_selector.append(path_copy_icon_selector);

                let span_copy_selector_text = customCreateElement({
                    tag: "span",
                    classes: ["text-xs", "font-semibold"],
                    text: "Copy Selector",
                });

                span_copy_selector.append(
                    svg_copy_icon_selector,
                    span_copy_selector_text
                );
                button_copy_selector_container.append(span_copy_selector);
                td_selector_body.append(button_copy_selector_container);

                let td_element_body = customCreateElement({
                    tag: "td",
                    classes: ["px-3", "py-2", "text-sm", "text-gray-500"],
                });

                let div_element_description_copy_code = customCreateElement({
                    tag: "div",
                    classes: [
                        "relative",
                        "break-all",
                        "bg-gray-50",
                        "rounded-lg",
                        "p-4",
                        "min-h-[50px]",
                    ],
                    text: node.html.toString(),
                });

                let div_element_copy_code = customCreateElement({
                    tag: "div",
                    classes: ["absolute", "top-2", "end-2", "bg-gray-50"],
                });

                let button_copy_element_container = customCreateElement({
                    tag: "button",
                    classes: [
                        "text-gray-900",
                        "text-nowrap",
                        "m-0.5",
                        "hover:bg-gray-100",
                        "rounded-lg",
                        "py-2",
                        "px-2.5",
                        "inline-flex",
                        "items-center",
                        "justify-center",
                        "bg-white",
                        "border-gray-200",
                        "border",
                        "h-8",
                    ],
                    attrs: [
                        {
                            key: "onclick",
                            value: `navigator.clipboard.writeText(\`${node.html}\`)`,
                        },
                    ],
                });

                let span_copy_element = customCreateElement({
                    tag: "span",
                    classes: ["inline-flex", "items-center"],
                });

                let svg_copy_icon_element = customCreateElementNS({
                    tag: "svg",
                    namespace: "http://www.w3.org/2000/svg",
                    classes: ["w-3", "h-3", "me-1.5"],
                    attrs: [
                        { key: "aria-hidden", value: true },
                        { key: "fill", value: "currentColor" },
                        { key: "viewBox", value: "0 0 18 20" },
                    ],
                });

                let path_copy_icon_element = customCreateElementNS({
                    tag: "path",
                    namespace: "http://www.w3.org/2000/svg",
                    attrs: [
                        {
                            key: "d",
                            value: "M16 1h-3.278A1.992 1.992 0 0 0 11 0H7a1.993 1.993 0 0 0-1.722 1H2a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2Zm-3 14H5a1 1 0 0 1 0-2h8a1 1 0 0 1 0 2Zm0-4H5a1 1 0 0 1 0-2h8a1 1 0 1 1 0 2Zm0-5H5a1 1 0 0 1 0-2h2V2h4v2h2a1 1 0 1 1 0 2Z",
                        },
                    ],
                });

                svg_copy_icon_element.append(path_copy_icon_element);

                let span_copy_element_text = customCreateElement({
                    tag: "span",
                    classes: ["text-xs", "font-semibold"],
                    text: "Copy Code",
                });

                span_copy_element.append(
                    svg_copy_icon_element,
                    span_copy_element_text
                );
                button_copy_element_container.append(span_copy_element);

                div_element_copy_code.append(button_copy_element_container);
                div_element_description_copy_code.append(div_element_copy_code);

                td_element_body.append(div_element_description_copy_code);

                tr_node.append(td_selector_body, td_element_body);
                tbody_nodes.append(tr_node);
            });

            table_nodes_container.append(thead_nodes, tbody_nodes);
            div_table_container.append(table_nodes_container);

            li_violation_container.append(
                div_impact_description_container,
                div_table_container
            );

            ul_card_body.append(li_violation_container);
        });

        return ul_card_body;
    };

    // Spec Card: each violation details
    const createSpecsCards = () => {
        let ul_spec_cards = customCreateElement({
            tag: "ul",
            classes: [
                "flex",
                "flex-col",
                "gap-6",
                "max-w-7xl",
                "p-4",
                "pb-0",
                "sm:p-6",
                "sm:pb-0",
                "lg:p-8",
                "lg:pb-0",
                "mx-auto",
            ],
        });

        specs_results.forEach((spec) => {
            let li_card_container = customCreateElement({
                tag: "li",
                classes: [
                    "divide-y",
                    "divide-gray-200",
                    "bg-white",
                    "shadow-xs",
                    "border",
                    "border-gray-200",
                    "hidden",
                ],
            });

            li_card_container.append(
                createCardHeader(spec),
                createCardBody(spec)
            );
            ul_spec_cards.append(li_card_container);
        });

        return ul_spec_cards;
    };

    // Footer
    const createFooter = () => {
        let footer_container = customCreateElement({
            tag: "footer",
            classes: [
                "footer",
                "text-xs",
                "text-gray-600",
                "max-w-7xl",
                "p-4",
                "sm:p-6",
                "lg:p-8",
                "mx-auto",
            ],
        });

        let div_copy_container = customCreateElement({
            tag: "div",
            classes: ["text-center"],
        });

        let a_reporter_npm_link = customCreateElement({
            tag: "a",
            classes: ["font-medium", "capitalize", "underline"],
            attrs: [
                {
                    key: "href",
                    value: "https://www.npmjs.com/package/cypress-axe-reporter",
                },
                {
                    key: "target",
                    value: "_blank",
                },
                {
                    key: "rel",
                    value: "noopener noreferrer",
                },
            ],
            text: "cypress-axe-reporter",
        });

        let a_author_github_link = customCreateElement({
            tag: "a",
            classes: ["font-medium", "capitalize", "underline"],
            attrs: [
                {
                    key: "href",
                    value: "https://github.com/psegurap",
                },
                {
                    key: "target",
                    value: "_blank",
                },
                {
                    key: "rel",
                    value: "noopener noreferrer",
                },
            ],
            text: "Pedro Segura",
        });

        let p_copy = customCreateElement({ tag: "p" });

        p_copy.append(
            "© ",
            new Date().getFullYear(),
            " ",
            a_reporter_npm_link,
            " was designed and built by ",
            a_author_github_link,
            "."
        );
        div_copy_container.append(p_copy);
        footer_container.append(div_copy_container);
        return footer_container;
    };

    document.body.append(createSpecsCards(), createFooter());

    let store_report_on_location = path.join(
        "./",
        drOpts.reportDir,
        drOpts.reportFilename + ".html"
    );

    await fsePromises.writeFile(
        store_report_on_location,
        "<!DOCTYPE html>" + document.documentElement.outerHTML
    );

    console.log("REPORT SAVED ON: " + store_report_on_location);
};

const generateJSONReport = async (test_results) => {
    console.log("BUILDING JSON REPORT...");

    let critical_count = 0,
        serious_count = 0,
        moderate_count = 0,
        minor_count = 0;

    test_results.map((spec) => {
        critical_count += spec.a11y.violations.filter(
            (violation) => violation.impact == "critical"
        ).length;
        serious_count += spec.a11y.violations.filter(
            (violation) => violation.impact == "serious"
        ).length;
        moderate_count += spec.a11y.violations.filter(
            (violation) => violation.impact == "moderate"
        ).length;
        minor_count += spec.a11y.violations.filter(
            (violation) => violation.impact == "minor"
        ).length;
    });

    let json_report = {
        test_results,
    };

    if (drOpts.includeSummary) {
        json_report["summary"] = {
            pages: test_results.length,
            critical: critical_count,
            serious: serious_count,
            moderate: moderate_count,
            minor: minor_count,
        };
    }

    let store_report_on_location = path.join(
        "./",
        drOpts.reportDir,
        drOpts.reportFilename + ".json"
    );

    await fsePromises.writeFile(
        store_report_on_location,
        JSON.stringify(json_report, null, 2)
    );

    console.log("REPORT SAVED ON: " + store_report_on_location);
};

module.exports = generateReport;
