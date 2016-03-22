SubsCache = class subsCache {
  constructor () {}
  subscribe (...params) {
    return Meteor.subscribe(...params)
  }
}