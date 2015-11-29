Package.describe({
  name: 'financebutler:eslint',
  version: '1.0.0',
  summary: 'The pluggable linting utility for JavaScript and JSX.',
});

Package.registerBuildPlugin({
  name: 'eslint',
  sources: [
    'plugin/eslint.js',
  ],
  npmDependencies: {
    'eslint': '1.10.2',
    'babel-eslint': '5.0.0-beta3',
    'eslint-config-airbnb': '1.0.2',
    'strip-json-comments': '2.0.0',
    'eslint-plugin-angular': '0.14.0',
  },
});

Package.onUse(function onUse(api) {
  api.use('isobuild:linter-plugin@1.0.0');
});

Package.onTest(function onTest(api) {
  api.use('tinytest');
  api.use('financebutler:eslint');
});
