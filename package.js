Package.describe({
  name: 'cottz:subscache',
  version: '0.1.0',
  summary: 'Save a copy of your documents in the client and use them even without ready subscriptions',
  documentation: 'README.md',
  git: 'https://github.com/Goluis/subs-cache'
});

Package.onUse(function(api) {
  api.versionsFrom('1.3.5.1');

  api.use('ecmascript');
  api.use([
    'underscore',
    'mongo',
    'tracker',
    'reactive-var'
  ], 'client');

  api.mainModule('client/index.js', 'client');
  api.mainModule('server/index.js', 'server');
});