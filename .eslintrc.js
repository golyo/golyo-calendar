const path = require('path');

// Use this file as a starting point for your project's .eslintrc.
// Copy this file, and add rule overrides as needed.
module.exports = {
  extends: ['airbnb-typescript', 'airbnb/hooks'],
  parser: '@typescript-eslint/parser',
  parserOptions: { sourceType: 'module', project: './tsconfig.json' },
  plugins: ["react", "import"],

  settings: {
    'import/resolver': {
      node: {
        paths: [path.resolve(__dirname, './src')],
        extensions: ['.js', '.json', '.ts', '.tsx'],
      },
    },
  },

  rules: {
    'max-len': ['error', { code: 160, ignoreStrings: true }],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'operator-linebreak': ['error', 'after'],
    'quote-props': ['warn', 'consistent-as-needed'],

    'import/no-named-as-default': 'off',
    'import/named': 'off',
    'import/extensions': ['error', 'ignorePackages', { js: 'never', json: 'never', ts: 'never', tsx: 'never' }],

    // we dont need because of mobile app
    'jsx-a11y/interactive-supports-focus': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',

    'react/destructuring-assignment': 'off',
    'react/jsx-filename-extension': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/jsx-indent': ['error', 2, { indentLogicalExpressions: true }],
    'react/state-in-constructor': 'off',
    'react/static-property-placement': 'off',
    'react/require-default-props': 'off',
    'react/no-danger': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: false,
        optionalDependencies: false,
        peerDependencies: false,
      },
    ],
  },

  env: {
    jest: true,
  },

  globals: {
    window: true,
    document: true,
    Saml2: true,
    Geofence: true,
  },
};