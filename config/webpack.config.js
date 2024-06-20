"use strict";

const { merge } = require("webpack-merge");

const common = require("./webpack.common.js");
const PATHS = require("./paths");

// Merge webpack configuration files
const config = (env, argv) =>
  merge(common, {
    entry: {
      popup: [PATHS.src + "/popup.ts", PATHS.src + "/popup.css"],
      contentScript: PATHS.src + "/contentScript.ts",
      background: PATHS.src + "/background.ts",
      logger: PATHS.src + "/logger.ts",
      common: PATHS.src + "/common.ts",
    },
    devtool: argv.mode === "production" ? false : "inline-source-map",
  });

module.exports = config;
