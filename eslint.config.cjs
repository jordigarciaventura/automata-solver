// ESLint configuration for automata-solver project
module.exports = {
    files: ["**/*.js"],
    languageOptions: {
        ecmaVersion: 2021,
        sourceType: "module",
        globals: {
            document: "readonly",
            window: "readonly",
            setTimeout: "readonly",
            Blob: "readonly",
            URL: "readonly",
            FileReader: "readonly",
            localStorage: "readonly",
            XMLSerializer: "readonly",
            console: "readonly"
        },
    },
    rules: {
        "no-unused-vars": "warn",
        "no-undef": "error",
        "semi": ["error", "always"],
        "quotes": ["error", "double"],
        "eqeqeq": "error"
    },
    ignores: ["node_modules/**"]
};
