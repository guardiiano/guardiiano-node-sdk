module.exports = {
  root: true,
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
    project: "./tsconfig.json",
  },
  env: {
    node: true,
  },
  rules: {
    quotes: [0, "double"],
    "@typescript-eslint/quotes": [0, "double"],
    indent: ["error", 2, { SwitchCase: 1 }],
    "no-extra-boolean-cast": 0,
    "newline-after-var": [0, "never"],
    "for-direction": "error",
    "no-cond-assign": "error",
    "no-dupe-else-if": "error",
    "no-duplicate-case": "error",
    "@typescript-eslint/no-explicit-any": 0, // serve a non far uscire errore per gli any
    "prefer-rest-params": 0,
    "no-case-declarations": 0,
    "@typescript-eslint/no-var-requires": 0,
    "import/no-extraneous-dependencies": 0,
    "@typescript-eslint/brace-style": 0,
    "@typescript-eslint/no-unused-expressions": 0,
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "variable",
        format: ["snake_case"],
      },
    ],
  },
  ignorePatterns: ["node_modules/", ".git/", ".github/", "dist/", "**/*.test.ts"],
};
