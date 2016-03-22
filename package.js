Package.describe({
  name: 'cottz:subscache',
  version: '0.0.2',
  summary: 'Save a copy of your documents in the client and use them even without ready subscriptions',
  documentation: 'README.md',
  git: 'https://github.com/Goluis/subs-cache'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');

  api.use('ecmascript');
  api.use([
    'underscore',
    'mongo',
    'reactive-var'
  ], 'client');

  api.addFiles([
    'lib/stream.js',
    'lib/subscache.js',
    'lib/subscription.js',
    'lib/collection.js'
  ], 'client');
  
  api.addFiles('lib/server.js', 'server');

  api.export('SubsCache');
});