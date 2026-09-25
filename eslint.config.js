export default [
    {
        files: ["js/**/*.js", "modules/**/*.js", "security/**/*.js", "*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                window: "readonly",
                document: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                setInterval: "readonly",
                clearInterval: "readonly",
                CustomEvent: "readonly",
                location: "readonly",
                navigator: "readonly",
                Blob: "readonly",
                URL: "readonly",
                TextEncoder: "readonly",
                TextDecoder: "readonly",
                localStorage: "readonly",
                sessionStorage: "readonly",
                caches: "readonly",
                performance: "readonly",
                fetch: "readonly",
                process: "readonly",
                module: "readonly",
                require: "readonly",
                __dirname: "readonly",
                tflite: "readonly",
                crypto: "readonly"
            }
        },
        rules: {
            "no-eval": "error",
            "no-implied-eval": "error",
            "no-new-func": "error",
            "no-script-url": "error",
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "no-undef": "error"
        }
    }
];
