module.exports = {
    extends: [
        'eslint:recommended'
    ],
    env: {
        browser: true,
        es2022: true
    },
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
    },
    rules: {
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-script-url': 'error',
        'no-unsanitized/method': 'error',
        'no-unsanitized/property': 'error',
        'security/detect-buffer-noassert': 'error',
        'security/detect-child-process': 'error',
        'security/detect-disable-mustache-escape': 'error',
        'security/detect-eval-with-expression': 'error',
        'security/detect-no-csrf-before-method-override': 'error',
        'security/detect-non-literal-fs-filename': 'error',
        'security/detect-non-literal-regexp': 'error',
        'security/detect-non-literal-require': 'error',
        'security/detect-object-injection': 'error',
        'security/detect-possible-timing-attacks': 'error',
        'security/detect-pseudoRandomBytes': 'error',
        'security/detect-unsafe-regex': 'error'
    },
    plugins: [
        'security',
        'no-unsanitized'
    ]
};
