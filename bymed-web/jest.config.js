const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import("jest").Config} */
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  testMatch: [
    "**/*.test.[jt]s?(x)",
    "**/*.property.test.[jt]s?(x)",
  ],
};

module.exports = createJestConfig(customJestConfig);
