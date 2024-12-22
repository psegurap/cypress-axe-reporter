const beforeRunHook = require("./lib/beforeRunHook")
const afterRunHook = require("./lib/afterRunHook")

module.exports = function (on) {
  on('before:run', async (details) => {
    await beforeRunHook(details);
  });

  on('after:run', async (results) => {
    await afterRunHook(results);
  });
};
