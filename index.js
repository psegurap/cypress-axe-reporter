const addErrorColor = (message) => {
    return `\x1b[31m ${message}\x1b[0m`;
};

const addSuccessColor = (message) => {
    return `\x1b[32m ${message}\x1b[0m`;
};

function reporter(runner, options) {
    runner.on("start", () => {
        console.log(`${runner["suite"]["suites"][0].title}\n`);
    });

    runner.on("fail", function (test, err) {
        console.log(`${addErrorColor("\uFF58")} ${test.title}\n`);
        console.log(`${addErrorColor(err.stack)}\n`);
    });

    runner.on("pass", function (test) {
        console.log(`${addSuccessColor("\u2713")} ${test.title}\n`);
    });
}

module.exports = reporter;
