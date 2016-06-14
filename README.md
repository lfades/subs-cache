Cottz subscache
=============================

subscache allows you to store all documents received by a collection on the client without deleting them when changing subscription.
unlike subsmanager I don't keep active subscriptions I keep documents

## Installation
```sh
$ meteor add cottz:subscache
```

## Quick Start
```js
import SubsCache from 'meteor/cottz:subscache';

APPCache = new SubsCache({
  expireIn: 10,
  inAll: false
});

// publish
Meteor.publish('users', function (skip) {
  return Meteor.users.find({}, {skip: skip});
});

// Router
FlowRouter.route('/users', {
  subscriptions (params, query) {
    this.register('my users', APPCache.subscribe('users', Number(query.skip) || 0));
  }
});

// template
Template.user.helpers({
  users () {
    return APPCache.find('users', Meteor.users);
  }
});
```
### subscache options
`expireIn` is the time in minutes before the stored documents begin to remove or null if you don't want to remove them
`inAll` if true the find() will bring all documents stored
```js
// the next values are the defaults
APPCache = new SubsCache({
  expireIn: 10,
  inAll: false
});
```
#### wait a moment... inAll is what ?
Suppose You have a collection with 100 documents, the user has a pagination in batches of 10 documents

when `inAll` is false (default) whenever the user changes the pagination always see 10 documents and documents of previous pages will be used to return the documents immediately if the user returns to a previous page
when `inAll` is true always get the documents that match your query, if the user changes the pagination 3 times he will see 30 documents unless the query limits them, by default a findOne() always use inAll as true

### subscribe
he subscription works exactly like the subscription in Meteor
```js
APPCache.subscribe('users', params);
```

### find() and findOne()
parameters (in order) are:

 - the name of the subscription
 - a mongo collection
 - cursor selector (not required)
 - cursor options (not required)
```js
APPCache = new SubsCache();

APPCache.find('users', Meteor.users, {}, {});
APPCache.findOne('users', Meteor.users, {}, {});
```

### subscache.ready
```js
APPCache = new SubsCache();
// is reactive
// true if the subscription users is ready
APPCache.ready('users');
// true if all subscriptions are ready
APPCache.ready();
```

### subscache.use
```js
APPCache = new SubsCache();

let users = APPCache.use('users', Meteor.users);
let usersSub = APPCache.use('users');

users.find({}, {});

usersSub.find(Meteor.users, {}, {});
usersSub.find(Profiles, {}, {});
```